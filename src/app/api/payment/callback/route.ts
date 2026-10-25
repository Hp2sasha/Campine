import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayment } from "@/lib/zarinpal";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const authority = sp.get("Authority") ?? "";
  const status = sp.get("Status") ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const payment = await db.payment.findFirst({ where: { authority }, include: { booking: { include: { trip: true } } } });
  if (!payment) {
    return NextResponse.redirect(new URL("/payment/result?status=failed", appUrl));
  }

  const bookingId = payment.bookingId;

  // Idempotency: اگر قبلا پرداخت شده، دوباره نزن
  if (payment.status === "paid") {
    return NextResponse.redirect(
      new URL(`/payment/result?status=success&booking=${bookingId}&ref=${payment.refId ?? ""}`, appUrl)
    );
  }

  if (status !== "OK") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.redirect(
      new URL(`/payment/result?status=failed&booking=${bookingId}`, appUrl)
    );
  }

  // مبلغِ زنده را از DB محاسبه کن — جلوی دستکاریِ قیمت
  const expectedAmount = payment.booking.trip.price * payment.booking.seats;
  if (payment.amount !== expectedAmount) {
    console.error(`[payment] amount mismatch booking=${bookingId} stored=${payment.amount} expected=${expectedAmount}`);
    await db.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    return NextResponse.redirect(new URL(`/payment/result?status=failed&booking=${bookingId}`, appUrl));
  }

  const result = await verifyPayment({
    amountToman: expectedAmount,
    authority,
  });

  if (!result.ok) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.redirect(
      new URL(`/payment/result?status=failed&booking=${bookingId}`, appUrl)
    );
  }

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        refId: result.refId,
        paidAt: new Date(),
      },
    }),
    db.booking.update({
      where: { id: bookingId },
      data: { status: "paid" },
    }),
  ]);

  return NextResponse.redirect(
    new URL(
      `/payment/result?status=success&booking=${bookingId}&ref=${result.refId ?? ""}`,
      appUrl
    )
  );
}
