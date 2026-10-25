import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requestPayment } from "@/lib/zarinpal";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const fd = await req.formData();
  const bookingId = Number(fd.get("bookingId"));
  if (!Number.isFinite(bookingId)) {
    return NextResponse.redirect(new URL("/panel/bookings?error=notfound", req.url));
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true },
  });
  if (!booking || booking.passengerId !== user.id) {
    return NextResponse.redirect(new URL("/panel/bookings?error=forbidden", req.url));
  }
  if (booking.status !== "approved") {
    return NextResponse.redirect(
      new URL(`/panel/bookings/${bookingId}?error=locked`, req.url)
    );
  }

  const amount = booking.trip.price * booking.seats;
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/api/payment/callback`;

  try {
    const { authority, url } = await requestPayment({
      amountToman: amount,
      description: `SafarYar booking ${booking.code} - ${booking.trip.title}`,
      callbackUrl,
    });

    await db.payment.upsert({
      where: { bookingId: booking.id },
      update: { amount, authority, status: "initiated", refId: null, paidAt: null },
      create: {
        bookingId: booking.id,
        amount,
        authority,
        status: "initiated",
      },
    });

    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(
      new URL(`/payment/result?status=failed&booking=${bookingId}`, req.url)
    );
  }
}
