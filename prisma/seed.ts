import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function day(offset: number, hour = 9) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const password = () => bcrypt.hash("pass1234", 10);

async function main() {
  const hash = await password();

  const users = [
    { name: "علی مدیری", email: "admin@campine.ir", phone: "09121234567", role: "admin", bio: "مدیر سامانه کمپینه" },
    { name: "سارا کوهنورد", email: "leader1@campine.ir", phone: "09121112233", role: "leader", bio: "لیدر کوهنوردی با ۱۰ سال سابقه صعود.", bioEn: "Mountain guide with 10 years of summit experience." },
    { name: "امیر رضایی", email: "leader2@campine.ir", phone: "09124445566", role: "leader", bio: "راهنمای جزیره و دریا، متخصص تورهای جنوب.", bioEn: "Island and sea tours specialist." },
    { name: "مریم سفر", email: "leader3@campine.ir", phone: "09127778899", role: "leader", bio: "لیدر طبیعت‌گردی و جنگل‌نوردی شمال ایران.", bioEn: "Nature and forest tour leader in northern Iran." },
    { name: "نگار احمدی", email: "passenger1@campine.ir", phone: "09351234567", role: "passenger", bio: "عاشق کوه و طبیعت" },
    { name: "محمد رحیمی", email: "passenger2@campine.ir", phone: "09359876543", role: "passenger" },
    { name: "Elisa de Vries", email: "passenger3@campine.ir", phone: "09120000007", role: "passenger", bioEn: "Hiking beginner" },
  ] as const;

  const oldEmails: Record<string, string> = {
    "admin@campine.ir": "admin@safaryar.ir",
    "leader1@campine.ir": "leader1@safaryar.ir",
    "leader2@campine.ir": "leader2@safaryar.ir",
    "leader3@campine.ir": "leader3@safaryar.ir",
    "passenger1@campine.ir": "passenger1@safaryar.ir",
    "passenger2@campine.ir": "passenger2@safaryar.ir",
    "passenger3@campine.ir": "passenger3@safaryar.ir",
  };

  for (const u of users) {
    const data = {
      phone: u.phone,
      name: u.name,
      role: u.role,
      bio: "bio" in u ? u.bio : undefined,
      bioEn: "bioEn" in u ? u.bioEn : undefined,
    };
    // migrate legacy safaryar.ir accounts to campine.ir + normalized phone
    const legacy = await prisma.user.findUnique({ where: { email: oldEmails[u.email] } });
    const target = await prisma.user.findUnique({ where: { email: u.email } });
    if (legacy && legacy.id !== target?.id) {
      await prisma.user.update({ where: { id: legacy.id }, data: { email: u.email, ...data } });
    } else if (target) {
      await prisma.user.update({ where: { id: target.id }, data });
    } else {
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          phone: u.phone,
          passwordHash: hash,
          role: u.role,
          bio: "bio" in u ? u.bio : null,
          bioEn: "bioEn" in u ? u.bioEn : null,
        },
      });
    }
  }

  const leader = async (n: number) =>
    (await prisma.user.findUnique({ where: { email: `leader${n}@campine.ir` } }))!.id;

  type TripSeed = {
    code: string; title: string; titleEn: string; destination: string; destinationEn: string;
    description: string; descriptionEn: string; includes: string; includesEn: string;
    excludes: string; excludesEn: string; start: number; end: number; price: number;
    capacity: number; imageUrl: string | null; status: string; leader: number; adminNote?: string;
  };

  const trips: TripSeed[] = [
    {
      code: "TR-1001",
      title: "صعود به قله دماوند — بام ایران",
      titleEn: "Mount Damavand Summit — Roof of Iran",
      destination: "مازندران، دماوند", destinationEn: "Damavand, Mazandaran",
      description: "سه روز صعود تخصصی به بلندترین قله ایران با اقامت در پناهگاه‌های کوهستانی. مناسب کوهنوردان با آمادگی جسمانی متوسط به بالا.",
      descriptionEn: "A three-day technical climb to Iran's highest peak with mountain-hut accommodation.",
      includes: "حمل بار توسط قاطر تا ارتفاع ۴۲۰۰\nاقامت در پناهگاه\nبیمه ورزشی\nراهنمای حرفه‌ای\nوعده‌های غذایی برنامه",
      includesEn: "Mule transport to 4,200 m\nHut accommodation\nSports insurance\nProfessional guide\nPlanned meals",
      excludes: "هزینه رفت و آمد تا پای برنامه\nلباس و تجهیزات شخصی",
      excludesEn: "Transport to the meeting point\nPersonal clothing and gear",
      start: 20, end: 23, price: 12500000, capacity: 12,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
      status: "published", leader: 1,
    },
    {
      code: "TR-1002",
      title: "جشنواره ساحلی کیش — آفتاب و دریا",
      titleEn: "Kish Beach Festival — Sun & Sea",
      destination: "هرمزگان، جزیره کیش", destinationEn: "Kish Island, Hormozgan",
      description: "چهار روز اقامت ساحلی در کیش با برنامه‌های تفریحی، غواصی و گشت جزیره.",
      descriptionEn: "Four beach days on Kish island with recreation, diving and island tours.",
      includes: "پرواز رفت و برگشت\nاقامت هتل ۴ ستاره\nصبحانه\nگشت جزیره",
      includesEn: "Round flights\n4-star hotel\nBreakfast\nIsland tour",
      excludes: "ناهار و شام\nهزینه‌های شخصی",
      excludesEn: "Lunch & dinner\nPersonal expenses",
      start: 31, end: 34, price: 18900000, capacity: 20,
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
      status: "published", leader: 1,
    },
    {
      code: "TR-1003",
      title: "جنگل‌های ماسال و اقامت در اقیانوس ابرها",
      titleEn: "Masal Forests & Above the Clouds",
      destination: "گیلان، ماسال", destinationEn: "Masal, Gilan",
      description: "سه روز اقامت در ییلاقات ماسال، پیاده‌روی جنگلی و تماشای اقیانوس ابرها.",
      descriptionEn: "Three days in Masal highlands, forest walks and cloud-sea views.",
      includes: "اقامت بوم‌گردی\nصبحانه و شام\nلیدر محلی\nبیمه",
      includesEn: "Eco-lodge\nBreakfast & dinner\nLocal guide\nInsurance",
      excludes: "حمل‌ونقل شخصی\nخرید سوغات",
      excludesEn: "Personal transport\nSouvenirs",
      start: 45, end: 47, price: 6800000, capacity: 16,
      imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
      status: "published", leader: 2,
    },
    {
      code: "TR-1004",
      title: "کمپ ستاره‌شناسی کویر مرنجاب",
      titleEn: "Maranjab Desert Stargazing Camp",
      destination: "اصفهان، مرنجاب", destinationEn: "Maranjab, Isfahan",
      description: "دو شب کمپ در قلب کویر مرنجاب، رصد آسمان شب با تلسکوپ حرفه‌ای و شترسواری.",
      descriptionEn: "Two nights camping in Maranjab desert with professional stargazing and camel riding.",
      includes: "کمپ و تجهیزات\nتلسکوپ\nوعده‌های کمپ\nلیدر",
      includesEn: "Camp & gear\nTelescope\nCamp meals\nLeader",
      excludes: "کیسه خواب شخصی",
      excludesEn: "Personal sleeping bag",
      start: 52, end: 54, price: 8500000, capacity: 18,
      imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
      status: "published", leader: 3,
    },
    {
      code: "TR-1005",
      title: "جاده رویایی اسالم به خلخال",
      titleEn: "Asalem–Khalkhal Dream Road",
      destination: "گیلان به اردبیل", destinationEn: "Gilan to Ardabil",
      description: "سفر دو روزه در یکی از زیباترین جاده‌های ایران با توقف‌های عکاسی و اقامت روستایی.",
      descriptionEn: "Two days on one of Iran's most beautiful roads with photo stops and village stay.",
      includes: "ون دربستی\nاقامت روستایی\nصبحانه\nلیدر",
      includesEn: "Private van\nVillage stay\nBreakfast\nLeader",
      excludes: "وعده‌های آزاد",
      excludesEn: "Free meals",
      start: 60, end: 61, price: 4200000, capacity: 14,
      imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80",
      status: "published", leader: 2,
    },
    {
      code: "TR-1006",
      title: "سفر پاییزی ارسباران — رنگ‌های خلقت",
      titleEn: "Arasbaran Autumn Colors",
      destination: "آذربایجان شرقی، ارسباران", destinationEn: "Arasbaran, East Azerbaijan",
      description: "سه روز گشت پاییزی در جنگل‌های ارسباران، روستاهای تاریخی و عکاسی طبیعت.",
      descriptionEn: "Three autumn days in Arasbaran forests and historic villages.",
      includes: "اقامت\nصبحانه و شام\nلیدر\nبیمه",
      includesEn: "Stay\nBreakfast & dinner\nLeader\nInsurance",
      excludes: "هزینه‌های شخصی",
      excludesEn: "Personal expenses",
      start: -35, end: -32, price: 7500000, capacity: 15,
      imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80",
      status: "published", leader: 1,
    },
    {
      code: "TR-1007",
      title: "صعود زمستانی قله سبلان",
      titleEn: "Winter Ascent of Sabalan",
      destination: "اردبیل، سبلان", destinationEn: "Sabalan, Ardabil",
      description: "صعود زمستانی فنی به قله سبلان با تجهیزات یخ‌نوردی. ویژه کوهنوردان باتجربه.",
      descriptionEn: "Technical winter ascent of Sabalan. Experienced climbers only.",
      includes: "تجهیزات فنی\nپناهگاه\nلیدر فنی\nبیمه ورزشی",
      includesEn: "Technical gear\nHut\nTechnical leader\nSports insurance",
      excludes: "لباس شخصی زمستانی",
      excludesEn: "Personal winter clothing",
      start: 110, end: 113, price: 15000000, capacity: 10,
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
      status: "approved", leader: 2,
    },
    {
      code: "TR-1008",
      title: "شیراز و تخت جمشید — سفر به قلب تاریخ",
      titleEn: "Shiraz & Persepolis",
      destination: "فارس، شیراز", destinationEn: "Shiraz, Fars",
      description: "سه روز گشت فرهنگی در شیراز، تخت جمشید، نقش رستم و بازار وکیل.",
      descriptionEn: "Three cultural days in Shiraz, Persepolis, Naqsh-e Rostam and Vakil Bazaar.",
      includes: "پرواز\nهتل\nصبحانه\nگشت‌ها",
      includesEn: "Flights\nHotel\nBreakfast\nTours",
      excludes: "ناهار و شام",
      excludesEn: "Lunch & dinner",
      start: 75, end: 77, price: 11000000, capacity: 20,
      imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80",
      status: "cancelled", leader: 3,
    },
    {
      code: "TR-1009",
      title: "اکوسیستم خلیج فارس — جزیره قشم",
      titleEn: "Persian Gulf Ecosystem — Qeshm",
      destination: "هرمزگان، قشم", destinationEn: "Qeshm, Hormozgan",
      description: "چهار روز اکوتوریسم در قشم: دره ستاره‌ها، جنگل حرا، غار نمکدان و ژئوپارک.",
      descriptionEn: "Four eco-tourism days on Qeshm: Stars Valley, Hara forest, Namakdan cave and Geopark.",
      includes: "پرواز\nاقامت\nگشت‌ها\nلیدر طبیعت",
      includesEn: "Flights\nStay\nTours\nNature guide",
      excludes: "غواصی\nهزینه‌های شخصی",
      excludesEn: "Diving\nPersonal expenses",
      start: 66, end: 69, price: 16500000, capacity: 16,
      imageUrl: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200&q=80",
      status: "published", leader: 1,
    },
    {
      code: "TR-1010",
      title: "جشن نوروز در اصفهان",
      titleEn: "Nowruz Celebration in Isfahan",
      destination: "اصفهان", destinationEn: "Isfahan",
      description: "اقامت نوروزی در اصفهان، گشت میدان نقش جهان و بازار بزرگ.",
      descriptionEn: "Nowruz stay in Isfahan with Naqsh-e Jahan square and bazaar tours.",
      includes: "هتل\nصبحانه\nگشت",
      includesEn: "Hotel\nBreakfast\nTour",
      excludes: "پرواز",
      excludesEn: "Flights",
      start: 150, end: 153, price: 9800000, capacity: 18,
      imageUrl: null,
      status: "cancelled", leader: 3,
    },
    {
      code: "TR-MVGUE07GHVJO",
      title: "گشت دریایی جزیره هرمز و قشم",
      titleEn: "Hormoz & Qeshm Sea Tour",
      destination: "هرمزگان، هرمز", destinationEn: "Hormoz, Hormozgan",
      description: "گشت دریایی سه‌روزه بین هرمز و قشم با قایق، بازدید از ساحل سرخ و دره مجسمه‌ها.",
      descriptionEn: "Three-day sea tour between Hormoz and Qeshm with Red Beach and Statue Valley.",
      includes: "قایق\nاقامت\nغذای دریایی\nلیدر",
      includesEn: "Boat\nStay\nSeafood\nLeader",
      excludes: "پرواز",
      excludesEn: "Flights",
      start: 92, end: 94, price: 9500000, capacity: 12,
      imageUrl: null,
      status: "pending", leader: 1,
    },
  ];

  for (const t of trips) {
    const data = {
      title: t.title,
      titleEn: t.titleEn,
      destination: t.destination,
      destinationEn: t.destinationEn,
      description: t.description,
      descriptionEn: t.descriptionEn,
      includes: t.includes,
      includesEn: t.includesEn,
      excludes: t.excludes,
      excludesEn: t.excludesEn,
      startDate: day(t.start),
      endDate: day(t.end),
      price: t.price,
      capacity: t.capacity,
      imageUrl: t.imageUrl,
      status: t.status,
      leaderId: await leader(t.leader),
    };
    await prisma.trip.upsert({
      where: { code: t.code },
      update: data,
      create: { code: t.code, ...data },
    });
  }

  const trip = (code: string) => prisma.trip.findUnique({ where: { code } }).then((t) => t!.id);
  const user = (email: string) => prisma.user.findUnique({ where: { email } }).then((u) => u!.id);

  const bookings = [
    { code: "BK-2001", trip: "TR-1001", email: "passenger1@campine.ir", seats: 2, status: "paid", note: "یک چادر دونفره می‌خواهیم.", payment: { amount: 25000000, refId: "2045879631", paidAt: -10 } },
    { code: "BK-2002", trip: "TR-1001", email: "passenger2@campine.ir", seats: 1, status: "pending", note: "اولین صعود ارتفاع بلندمه، راهنمایی بیشتر لطفاً." },
    { code: "BK-2003", trip: "TR-1002", email: "passenger2@campine.ir", seats: 2, status: "approved", leaderNote: "درخواست شما تایید شد. خوش سفر!" },
    { code: "BK-2004", trip: "TR-1003", email: "passenger1@campine.ir", seats: 3, status: "pending", note: "با خانواده می‌آییم." },
    { code: "BK-2005", trip: "TR-1005", email: "passenger3@campine.ir", seats: 1, status: "rejected", leaderNote: "متاسفانه ظرفیت گروه تکمیل است." },
    { code: "BK-2006", trip: "TR-1006", email: "passenger2@campine.ir", seats: 2, status: "completed", payment: { amount: 15000000, refId: "2041122334", paidAt: -50 } },
    { code: "BK-MVGU2PBCC1TW", trip: "TR-1002", email: "passenger1@campine.ir", seats: 1, status: "paid", payment: { amount: 18900000, refId: "MOCKREF-SEED", paidAt: -1 } },
  ];

  for (const b of bookings) {
    const existing = await prisma.booking.findUnique({ where: { code: b.code } });
    if (existing) continue;
    const created = await prisma.booking.create({
      data: {
        code: b.code,
        tripId: await trip(b.trip),
        passengerId: await user(b.email),
        seats: b.seats,
        status: b.status,
        note: b.note ?? null,
        leaderNote: b.leaderNote ?? null,
      },
    });
    if (b.payment) {
      await prisma.payment.create({
        data: {
          bookingId: created.id,
          amount: b.payment.amount,
          authority: `MOCK-SEED-${b.code}`,
          refId: b.payment.refId,
          status: "paid",
          paidAt: day(b.payment.paidAt),
        },
      });
    }
  }

  const coop = await prisma.cooperationRequest.findFirst({ where: { phone: "09121212121" } });
  if (!coop) {
    await prisma.cooperationRequest.create({
      data: {
        name: "مهدی صادقی",
        phone: "09121212121",
        email: "mehdi@example.com",
        city: "تهران",
        message: "لیدر کوهنوردی با ۵ سال سابقه، دارای مدرک فدراسیون کوهنوردی. مایل به همکاری در تورهای البرز هستم.",
      },
    });
    await prisma.cooperationRequest.create({
      data: {
        name: "الهام رستمی",
        phone: "09121313131",
        email: "elham@example.com",
        city: "شیراز",
        message: "راهنمای گردشگری جنوب ایران، آشنا با اقامتگاه‌های بوم‌گردی.",
      },
    });
  }

  console.log("Seeded. Demo phones — admin: 09121234567 | leaders: 09121112233, 09124445566, 09127778899 | passengers: 09351234567, 09359876543, 09120000007");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
