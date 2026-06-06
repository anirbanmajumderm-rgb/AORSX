import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PUBLIC_PAGES = [
  "/", "/", "/", "/",
  "/about", "/about",
  "/projects", "/projects",
  "/services", "/services", "/services",
  "/contact", "/contact",
  "/blog",
  "/faq",
  "/reviews",
];

const ADMIN_PAGES = [
  "/admin/login",
  "/admin/dashboard",
  "/admin/analytics",
  "/admin/content",
  "/admin/projects",
  "/admin/services",
  "/admin/reviews",
  "/admin/settings",
  "/admin/ai",
  "/admin/users",
];

function weightedPages(rand: () => number): string[] {
  const pages = [...PUBLIC_PAGES];
  if (rand() > 0.7) {
    pages.push(...ADMIN_PAGES.slice(0, Math.floor(rand() * ADMIN_PAGES.length)));
  }
  return pages;
}

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Brazil", "Japan", "Singapore"];

const DEVICES = ["desktop", "desktop", "desktop", "mobile", "mobile", "tablet"];

const REFERRERS = [
  "https://google.com", "https://google.com",
  "https://github.com",
  "https://linkedin.com",
  "https://twitter.com",
  "https://facebook.com",
  null, null, null, null, null,
];

const INTERACTION_TYPES = ["click", "click", "click", "scroll", "hover", "form_submit", "chat", "download"];

const REVIEWER_NAMES = [
  "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sarah Johnson", "Michael Chen",
  "David Wilson", "Emily Davis", "James Taylor", "Lisa Anderson", "Robert Brown",
  "Sneha Gupta", "Vikram Singh", "Neha Verma", "Arun Nair", "Rohit Mehta",
];

const REVIEW_TEXTS = [
  "Excellent work! Delivered ahead of schedule and exceeded expectations.",
  "Great communication throughout the project. Very professional team.",
  "The AI integration was seamless and has significantly improved our workflow.",
  "Highly recommend. Transformed our legacy system into a modern platform.",
  "Outstanding technical skills and creative problem-solving approach.",
  "Very responsive and proactive. A pleasure to work with.",
  "The dashboard they built is intuitive and our clients love it.",
  "Professional, timely, and delivered exactly what we needed.",
  "Impressed by the quality of code and attention to detail.",
  "They brought our vision to life. Would definitely work with them again.",
];

const VISITOR_NAMES = [
  "Alex Morgan", "Jordan Lee", "Taylor Reed", "Casey Quinn", "Morgan Chase",
  "Riley Blake", "Avery Dunn", "Quinn Fox", "Harper Wells", "Cameron Cole",
];

const QUESTION_TEXTS = [
  "What is the typical timeline for a full website redesign?",
  "Do you offer ongoing maintenance after project completion?",
  "Can you integrate AI chatbot into an existing website?",
  "What technologies do you use for backend development?",
  "How do you handle project milestones and reporting?",
  "Do you provide SEO services as part of web development?",
  "What is your pricing model — fixed or hourly?",
  "Can you work with our existing design team?",
  "How do you ensure website security and data protection?",
  "What experience do you have with e-commerce platforms?",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVisitorIds(count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(crypto.randomUUID());
  }
  return ids;
}

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

async function main() {
  const existingViews = await prisma.pageView.count();
  if (existingViews > 0) {
    console.log(`Found ${existingViews} existing page views. Clearing analytics data...`);
    await prisma.pageView.deleteMany();
    await prisma.interaction.deleteMany();
    await prisma.activityLog.deleteMany();
    console.log("Cleared existing analytics data.");
  }

  const rand = seedRandom(42);
  const totalUniqueVisitors = 350;
  const allVisitors = generateVisitorIds(totalUniqueVisitors + 50);

  const now = new Date();
  const pageViews: any[] = [];
  const interactions: any[] = [];
  const activityLogs: any[] = [];
  let activityId = 1;

  const interactionLabels: Record<string, string[]> = {
    click: ["nav-link", "cta-button", "project-card", "service-card", "social-link", "footer-link", "pagination", "menu-toggle"],
    scroll: ["page-scroll", "section-view"],
    hover: ["card-hover", "image-hover", "link-hover"],
    form_submit: ["contact-form", "newsletter", "search", "login-form"],
    chat: ["ai-assistant", "support-chat"],
    download: ["resume", "brochure", "case-study"],
  };

  const interactionPages: Record<string, string[]> = {
    click: ["/", "/about", "/projects", "/services", "/contact", "/blog"],
    scroll: ["/", "/about", "/projects", "/services", "/blog"],
    hover: ["/", "/projects", "/services"],
    form_submit: ["/contact", "/"],
    chat: ["/", "/about", "/services", "/contact"],
    download: ["/projects", "/services"],
  };

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const baseViews = isWeekend ? randomInt(30, 80) : randomInt(60, 180);
    const growthFactor = 1 + (29 - dayOffset) * 0.015;
    const dailyViews = Math.round(baseViews * growthFactor);

    const returningRatio = 0.3 + rand() * 0.2;
    const newVisitorCount = Math.round(dailyViews * (1 - returningRatio));
    const returningVisitorCount = dailyViews - newVisitorCount;

    const dayVisitors: string[] = [];
    for (let i = 0; i < returningVisitorCount; i++) {
      dayVisitors.push(allVisitors[randomInt(0, Math.min(totalUniqueVisitors - 1, Math.round((29 - dayOffset) * 3 + 20)))]);
    }
    for (let i = 0; i < newVisitorCount; i++) {
      const idx = totalUniqueVisitors + dayOffset * 2 + i;
      if (idx < allVisitors.length) dayVisitors.push(allVisitors[idx]);
    }

    const pages = weightedPages(rand);

    for (let i = 0; i < dailyViews; i++) {
      const hour = randomInt(6, 23);
      const minute = randomInt(0, 59);
      const pageViewTime = new Date(date);
      pageViewTime.setHours(hour, minute, randomInt(0, 59));

      pageViews.push({
        page: pick(pages),
        referrer: pick(REFERRERS),
        country: pick(COUNTRIES),
        device: pick(DEVICES),
        visitorId: dayVisitors[i % dayVisitors.length],
        createdAt: pageViewTime,
      });
    }

    const dailyInteractions = Math.round(dailyViews * (0.3 + rand() * 0.4));
    for (let i = 0; i < dailyInteractions; i++) {
      const hour = randomInt(7, 23);
      const minute = randomInt(0, 59);
      const interactionTime = new Date(date);
      interactionTime.setHours(hour, minute, randomInt(0, 59));

      const type = pick(INTERACTION_TYPES);
      const labels = interactionLabels[type] || ["generic"];
      const itPages = interactionPages[type] || ["/"];

      interactions.push({
        type,
        page: pick(itPages),
        label: pick(labels),
        metadata: null,
        visitorId: pick(dayVisitors),
        createdAt: interactionTime,
      });
    }

    if (rand() > 0.4) {
      const actions = [
        { action: `New visitor from ${pick(COUNTRIES)}`, type: "info" as const },
        { action: `${randomInt(1, 5)} new ${pick(["project", "service", "review"])} interactions`, type: "info" as const },
        { action: `AI chat session started`, type: "chat" as const },
        { action: `${pick(["Contact", "Newsletter", "Login"])} form submitted`, type: "create" as const },
        { action: `Page views spike detected on ${pick(["/", "/projects", "/services", "/about"])}`, type: "system" as const },
        { action: `New support ticket opened`, type: "review" as const },
      ];
      const action = pick(actions);
      const logTime = new Date(date);
      logTime.setHours(randomInt(8, 20), randomInt(0, 59));

      activityLogs.push({
        id: activityId++,
        action: action.action,
        detail: `Auto-generated activity for ${date.toISOString().slice(0, 10)}`,
        type: action.type,
        createdAt: logTime,
      });
    }
  }

  console.log(`Inserting ${pageViews.length} page views...`);
  for (let i = 0; i < pageViews.length; i += 500) {
    const batch = pageViews.slice(i, i + 500);
    await prisma.pageView.createMany({ data: batch });
  }

  console.log(`Inserting ${interactions.length} interactions...`);
  for (let i = 0; i < interactions.length; i += 500) {
    const batch = interactions.slice(i, i + 500);
    await prisma.interaction.createMany({ data: batch });
  }

  console.log(`Inserting ${activityLogs.length} activity logs...`);
  await prisma.activityLog.createMany({ data: activityLogs });

  await prisma.review.deleteMany();
  const projects: { id: string }[] = await prisma.project.findMany({ select: { id: true } });
  if (projects.length > 0) {
    const reviews: any[] = [];
    const numReviews = randomInt(8, 15);
    for (let i = 0; i < numReviews; i++) {
      const reviewDate = new Date(now);
      reviewDate.setDate(reviewDate.getDate() - randomInt(1, 90));
      reviews.push({
        projectId: pick(projects).id,
        reviewerName: pick(REVIEWER_NAMES),
        reviewerEmail: `reviewer${i}@example.com`,
        rating: randomInt(4, 5),
        reviewText: pick(REVIEW_TEXTS),
        isApproved: rand() > 0.1,
        isSpam: false,
        createdAt: reviewDate,
      });
    }
    await prisma.review.createMany({ data: reviews });
    console.log(`Inserted ${reviews.length} reviews.`);
  }

  await prisma.question.deleteMany();
  const questions: any[] = [];
  const numQuestions = randomInt(5, 12);
  for (let i = 0; i < numQuestions; i++) {
    const qDate = new Date(now);
    qDate.setDate(qDate.getDate() - randomInt(0, 60));
    const isAnswered = rand() > 0.3;
    questions.push({
      visitorName: pick(VISITOR_NAMES),
      visitorEmail: `visitor${i}@example.com`,
      visitorPhone: rand() > 0.5 ? `+1-555-${String(randomInt(100, 999)).padStart(3, "0")}-${String(randomInt(1000, 9999))}` : null,
      question: pick(QUESTION_TEXTS),
      adminReply: isAnswered ? "Thank you for your interest. We'd be happy to discuss this further. Please contact us directly for a detailed consultation." : null,
      isImportant: rand() > 0.85,
      isSpam: rand() > 0.95,
      status: isAnswered ? "answered" : "pending",
      createdAt: qDate,
    });
  }
  await prisma.question.createMany({ data: questions });
  console.log(`Inserted ${questions.length} questions.`);

  await prisma.notification.deleteMany();
  const notifications: any[] = [];
  const notifTypes = [
    { type: "info", title: "New review received", description: "A client has left a 5-star review" },
    { type: "warning", title: "New contact form submission", description: "A visitor has submitted the contact form" },
    { type: "info", title: "Question pending reply", description: "A visitor question needs your response" },
    { type: "success", title: "AI model updated", description: "The AI assistant model has been retrained" },
    { type: "info", title: "Traffic spike detected", description: "Unusually high traffic on the services page" },
  ];
  for (let i = 0; i < notifTypes.length; i++) {
    const nDate = new Date(now);
    nDate.setDate(nDate.getDate() - randomInt(0, 7));
    notifications.push({
      type: notifTypes[i].type,
      title: notifTypes[i].title,
      description: notifTypes[i].description,
      read: i === 0,
      link: i === 0 ? "/admin/reviews" : null,
      createdAt: nDate,
    });
  }
  await prisma.notification.createMany({ data: notifications });
  console.log(`Inserted ${notifications.length} notifications.`);

  const totalPV = await prisma.pageView.count();
  const totalInt = await prisma.interaction.count();
  const totalRev = await prisma.review.count();
  const totalQ = await prisma.question.count();
  const totalNotif = await prisma.notification.count();
  console.log(`\nDone! Total records:`);
  console.log(`  Page Views:    ${totalPV}`);
  console.log(`  Interactions:  ${totalInt}`);
  console.log(`  Activity Logs: ${activityLogs.length}`);
  console.log(`  Reviews:       ${totalRev}`);
  console.log(`  Questions:     ${totalQ}`);
  console.log(`  Notifications: ${totalNotif}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
