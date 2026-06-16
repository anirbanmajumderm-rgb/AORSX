import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {

  await prisma.admin.create({
    data: {
      username: "anirban",
      email: "anirbanmajumderm@gmail.com",
      password: hashSync("Admin@123", 12),
      name: "Anirban Majumder",
      role: "superadmin",
      email2FAEnabled: false,
    },
  });

  await prisma.company.create({
    data: {
      name: "AORNX",
      tagline: "AI SaaS Agency",
      description: "Professional web developer and AI specialist building modern scalable applications.",
        founderName: "Anirban Majumder",
        founderRole: "Founder & CEO",
        founderBio: "Full-stack developer & AI specialist with expertise in building modern scalable web applications.",
        email: "anirbanmajumderm@gmail.com",
        linkedin: "https://linkedin.com/in/anirbanmajumder",
        twitter: "https://twitter.com/anirbanmajumder",
        github: "https://github.com/anirbanmajumder",
    },
  });

  const founderCount = await prisma.teamMember.count({ where: { isFounder: true } });
  if (founderCount === 0) {
    await prisma.teamMember.create({
      data: {
        name: "Anirban Majumder",
        role: "Founder & CEO",
        bio: "Full-stack developer & AI specialist with expertise in building modern scalable web applications.",
        email: "anirbanmajumderm@gmail.com",
        linkedin: "https://linkedin.com/in/anirbanmajumder",
        twitter: "https://twitter.com/anirbanmajumder",
        github: "https://github.com/anirbanmajumder",
        displayOrder: 0,
        isFounder: true,
        isActive: true,
      },
    });
  }

  const whyChooseMeItems = [
    { title: "Fast Performance", description: "Optimized code and caching strategies for lightning-fast load times.", icon: "⚡", order: 1 },
    { title: "Secure Website", description: "Enterprise-grade security with encryption and best practices.", icon: "🔒", order: 2 },
    { title: "Modern UI/UX", description: "Beautiful and intuitive designs that users love.", icon: "🎨", order: 3 },
    { title: "AI Integration", description: "Cutting-edge AI features to automate and enhance your business.", icon: "🤖", order: 4 },
    { title: "Scalable System", description: "Built to grow with your business needs.", icon: "📈", order: 5 },
    { title: "Professional Support", description: "Dedicated support and maintenance services.", icon: "💼", order: 6 },
    { title: "Full Stack Expertise", description: "End-to-end development from frontend to backend.", icon: "🚀", order: 7 },
  ];

  for (const item of whyChooseMeItems) {
    await prisma.whyChooseMe.create({ data: item });
  }

  const features = [

    { key: "dark_mode", name: "Dark Mode", description: "Allow users to toggle dark/light mode", enabled: true, category: "ui" },
    { key: "animations", name: "Animations", description: "Enable premium page animations", enabled: true, category: "ui" },
    { key: "contact_form", name: "Contact Form", description: "Show contact form on the website", enabled: true, category: "core" },
    { key: "reviews", name: "Reviews System", description: "Display and manage user reviews", enabled: true, category: "core" },
    { key: "projects", name: "Portfolio", description: "Show portfolio projects section", enabled: true, category: "core" },
    { key: "seo", name: "SEO Optimization", description: "Enable meta tags and SEO features", enabled: true, category: "core" },
    { key: "security", name: "Security Headers", description: "Enable security response headers", enabled: true, category: "system" },
  ];

  for (const f of features) {
    await prisma.feature.create({ data: f });
  }

  const controls = [
    { key: "maintenance", name: "Maintenance Mode", description: "Show maintenance page to visitors", enabled: false, category: "system" },
    { key: "registration", name: "Allow Registration", description: "Enable new user sign-ups", enabled: true, category: "system" },
    { key: "cache", name: "Cache Enabled", description: "Enable page caching for faster loads", enabled: true, category: "system" },
    { key: "https", name: "Force HTTPS", description: "Redirect all traffic to HTTPS", enabled: true, category: "security" },
    { key: "analytics_tracking", name: "Analytics Tracking", description: "Collect visitor analytics data", enabled: true, category: "system" },
  ];

  for (const c of controls) {
    await prisma.websiteControl.create({ data: c });
  }

  const adminRoles = [
    { name: "Super Admin", description: "Full system access", permissions: JSON.stringify(["Dashboard", "Analytics", "Users", "Content", "Settings", "Roles", "Automation", "Media", "Reviews", "Notifications", "Controls", "Features"]) },
    { name: "Editor", description: "Content management access", permissions: JSON.stringify(["Dashboard", "Analytics", "Content", "Media", "Reviews", "Notifications"]) },
    { name: "Viewer", description: "Read-only access", permissions: JSON.stringify(["Dashboard", "Analytics"]) },
  ];

  for (const r of adminRoles) {
    await prisma.role.create({ data: r });
  }
}

  const services = [
    { title: "AI Development", description: "Custom AI solutions and machine learning models for your business.", icon: "brain", order: 1 },
    { title: "Web Development", description: "Modern, responsive, and performant web applications.", icon: "globe", order: 2 },
    { title: "Automation", description: "Streamline workflows with intelligent automation solutions.", icon: "zap", order: 3 },
    { title: "UI/UX Design", description: "Beautiful, intuitive interfaces that users love.", icon: "palette", order: 4 },
    { title: "SaaS Development", description: "Scalable SaaS platforms built for growth.", icon: "cloud", order: 5 },
    { title: "Backend Systems", description: "Robust, secure, and scalable backend infrastructure.", icon: "server", order: 6 },
    { title: "AI Chatbots", description: "Intelligent conversational AI for customer engagement.", icon: "message-circle", order: 7 },
    { title: "API Integration", description: "Seamless third-party API integration and development.", icon: "git-merge", order: 8 },
    { title: "Cloud Infrastructure & DevOps", description: "Scalable cloud architecture, CI/CD pipelines, and infrastructure automation.", icon: "cloud", order: 9 },
    { title: "Data Analytics & BI", description: "Transform raw data into actionable insights with custom dashboards and reporting.", icon: "bar-chart", order: 10 },
    { title: "Mobile App Development", description: "Cross-platform mobile applications with native performance and feel.", icon: "smartphone", order: 11 },
    { title: "Cybersecurity Solutions", description: "Protect your digital assets with comprehensive security audits and implementations.", icon: "shield", order: 12 },
    { title: "Digital Marketing & SEO", description: "Data-driven marketing strategies to boost your online presence and growth.", icon: "trending-up", order: 13 },
    { title: "IT Consulting & Strategy", description: "Expert guidance on technology roadmap, architecture, and digital transformation.", icon: "lightbulb", order: 14 },
  ];

  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { title: s.title } });
    if (!exists) await prisma.service.create({ data: s });
  }

  const skillItems = [
    { category: "Frontend", name: "HTML5", proficiency: 95, icon: "code2", order: 1 },
    { category: "Frontend", name: "CSS3 / Tailwind", proficiency: 92, icon: "palette", order: 2 },
    { category: "Frontend", name: "JavaScript / TypeScript", proficiency: 90, icon: "code2", order: 3 },
    { category: "Frontend", name: "React / Next.js", proficiency: 88, icon: "code2", order: 4 },
    { category: "Backend", name: "Node.js", proficiency: 85, icon: "server", order: 5 },
    { category: "Backend", name: "Python", proficiency: 80, icon: "code2", order: 6 },
    { category: "Backend", name: "PHP", proficiency: 75, icon: "code2", order: 7 },
    { category: "Database", name: "PostgreSQL", proficiency: 85, icon: "server", order: 8 },
    { category: "Database", name: "MySQL", proficiency: 80, icon: "server", order: 9 },
    { category: "Database", name: "MongoDB", proficiency: 75, icon: "server", order: 10 },
    { category: "AI & ML", name: "Machine Learning", proficiency: 82, icon: "brain", order: 11 },
    { category: "AI & ML", name: "LLM Integration", proficiency: 85, icon: "brain", order: 12 },
    { category: "AI & ML", name: "Computer Vision", proficiency: 70, icon: "brain", order: 13 },
    { category: "DevOps", name: "Docker", proficiency: 78, icon: "cloud", order: 14 },
    { category: "DevOps", name: "AWS / Cloud", proficiency: 75, icon: "cloud", order: 15 },
    { category: "DevOps", name: "CI/CD", proficiency: 72, icon: "zap", order: 16 },
    { category: "Design", name: "Figma", proficiency: 80, icon: "palette", order: 17 },
    { category: "Design", name: "UI/UX Design", proficiency: 78, icon: "palette", order: 18 },
  ];

  for (const s of skillItems) {
    const exists = await prisma.skill.findFirst({ where: { name: s.name, category: s.category } });
    if (!exists) await prisma.skill.create({ data: s });
  }

  const faqItems = [
    { question: "What services does AORNX offer?", answer: "We offer AI development, web development, automation, UI/UX design, SaaS development, backend systems, AI chatbots, API integration, cloud infrastructure, data analytics, mobile apps, cybersecurity, and digital marketing.", order: 1 },
    { question: "How long does a typical project take?", answer: "Project timelines vary based on scope. A simple website typically takes 2-4 weeks, while complex SaaS platforms can take 3-6 months. We'll provide a detailed timeline during consultation.", order: 2 },
    { question: "Do you offer post-launch support?", answer: "Yes, we provide comprehensive maintenance and support packages to ensure your project runs smoothly after launch.", order: 3 },
    { question: "What technologies do you specialize in?", answer: "We specialize in React, Next.js, TypeScript, Node.js, Python, AWS, Docker, PostgreSQL, TensorFlow, and various AI/ML frameworks.", order: 4 },
    { question: "Can you work with our existing team?", answer: "Absolutely. We can integrate with your existing development team or work independently as a full-service agency.", order: 5 },
    { question: "How do you handle project communication?", answer: "We use agile methodologies with regular updates via Slack, email, or your preferred communication channel.", order: 6 },
    { question: "What is your pricing model?", answer: "We offer both fixed-price and hourly billing options depending on project requirements. Contact us for a custom quote.", order: 7 },
    { question: "Do you offer free consultations?", answer: "Yes, we offer a free initial consultation to discuss your project requirements and provide a ballpark estimate.", order: 8 },
  ];

  for (const f of faqItems) {
    const exists = await prisma.fAQ.findFirst({ where: { question: f.question } });
    if (!exists) await prisma.fAQ.create({ data: f });
  }

  // Enable all section feature flags
  const featureFlagKeys = ["contact_form", "faq_section", "team_section", "services_section", "projects_section", "reviews_section"];
  for (const key of featureFlagKeys) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled: true },
      create: { key, label: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), enabled: true },
    });
  }

  // Always upsert settings so new keys are added on re-seed
  const settings = [
    { key: "site_title", value: "AORNX Portfolio", type: "text" },
    { key: "hero_heading", value: "WELCOME TO AORNX", type: "text" },
    { key: "hero_subtitle", value: "PROFESSIONAL WEB DEVELOPER & AI SPECIALIST", type: "text" },
    { key: "hero_headline", value: "WE BUILD|YOU GROW|", type: "text" },
    { key: "hero_tech_stack", value: "React,Next.js,TypeScript,Node.js,Python,AWS,GraphQL,Docker,PostgreSQL,TensorFlow", type: "text" },
    { key: "hero_projects", value: "150+", type: "text" },
    { key: "hero_projects_change", value: "+18% this year", type: "text" },
    { key: "hero_uptime", value: "99.9%", type: "text" },
    { key: "hero_uptime_label", value: "Uptime", type: "text" },
    { key: "hero_support", value: "24/7", type: "text" },
    { key: "hero_support_label", value: "Dedicated Support", type: "text" },
    { key: "admin_online", value: "true", type: "boolean" },
    // Section headings (editable via admin content page)
    { key: "sec_hero_label", value: "Next-Gen AI Agency", type: "text" },
    { key: "sec_about_subtitle", value: "We are a team of engineers, designers, and dreamers building the next generation of digital experiences.", type: "text" },
    { key: "sec_stats_label", value: "By The Numbers", type: "text" },
    { key: "sec_stats_title", value: "Our Impact in Metrics", type: "text" },
    { key: "sec_stats_description", value: "Numbers don't lie — here's what we've achieved together with our clients.", type: "text" },
    { key: "sec_services_label", value: "Our Services", type: "text" },
    { key: "sec_services_title", value: "What We Offer", type: "text" },
    { key: "sec_services_subtitle", value: "Comprehensive solutions tailored to your business needs", type: "text" },
    { key: "sec_projects_label", value: "Portfolio", type: "text" },
    { key: "sec_projects_title", value: "Featured Projects", type: "text" },
    { key: "sec_projects_subtitle", value: "Showcasing our best work — real projects, real results.", type: "text" },
    { key: "sec_reviews_label", value: "Testimonials", type: "text" },
    { key: "sec_reviews_title", value: "What Clients Say", type: "text" },
    { key: "sec_reviews_subtitle", value: "Hear from our clients about their experience working with us.", type: "text" },
    { key: "sec_skills_label", value: "Expertise", type: "text" },
    { key: "sec_skills_title", value: "Skills & Technologies", type: "text" },
    { key: "sec_skills_description", value: "Technologies and tools we use to bring ideas to life.", type: "text" },
    { key: "sec_faq_label", value: "FAQ", type: "text" },
    { key: "sec_faq_title", value: "Frequently Asked Questions", type: "text" },
    { key: "sec_faq_subtitle", value: "Got questions? We've got answers.", type: "text" },
    { key: "sec_contact_label", value: "Get In Touch", type: "text" },
    { key: "sec_contact_title", value: "Let's Work Together", type: "text" },
    { key: "sec_contact_subtitle", value: "Have a project in mind? We'd love to hear from you.", type: "text" },
    { key: "sec_why_label", value: "Why Choose Us", type: "text" },
    { key: "sec_why_title", value: "What Sets Us Apart", type: "text" },
    { key: "sec_why_description", value: "We deliver excellence through innovation, dedication, and expertise.", type: "text" },
    { key: "sec_guarantee_label", value: "100% Satisfaction Guaranteed", type: "text" },
    { key: "card_mission_title", value: "Our Mission", type: "text" },
    { key: "card_vision_title", value: "Our Vision", type: "text" },
    { key: "card_values_title", value: "Our Values", type: "text" },
    { key: "card_why_title", value: "Why Choose Us", type: "text" },
    { key: "card_policy_title", value: "Our Policy", type: "text" },
    { key: "card_rules_title", value: "Our Rules", type: "text" },
    { key: "card_commitment_title", value: "Our Commitment", type: "text" },
    { key: "meta_title", value: "AORNX | AI SaaS Agency", type: "text" },
    { key: "meta_description", value: "Professional web developer and AI specialist building modern scalable applications.", type: "text" },
    { key: "meta_keywords", value: "web development, AI, SaaS, portfolio, developer, AI specialist", type: "text" },
    { key: "about_us_headline", value: "About Us", type: "text" },
    { key: "about_us_body", value: "We are a forward-thinking AI SaaS agency dedicated to redefining what businesses can achieve through intelligent automation. From concept to deployment, we deliver solutions that drive growth.", type: "text" },
    { key: "company_values", value: "Innovation,Excellence,Integrity,Client-First", type: "text" },
    { key: "why_choose", value: "Cutting-Edge AI Technology,99.9% Uptime Guarantee,Award-Winning Design,Rapid Development", type: "text" },
    { key: "company_policy", value: "We follow a quality-first approach — every line of code, every pixel, and every interaction is crafted with precision. Transparency, accountability, and continuous improvement drive everything we do.", type: "text" },
    { key: "company_rules", value: "We adhere to strict ethical guidelines, data protection regulations, and industry best practices to ensure the highest standards of security and privacy.", type: "text" },
    { key: "company_commitment", value: "Every client partnership is built on trust, clear communication, and measurable results. We don't just deliver projects — we build lasting relationships.", type: "text" },
    { key: "stats_projects", value: "150", type: "text" },
    { key: "stats_clients", value: "50", type: "text" },
    { key: "stats_years", value: "6", type: "text" },
    { key: "stats_satisfaction", value: "99", type: "text" },
    { key: "auto_reply_enabled", value: "true", type: "boolean" },
    { key: "auto_reply_ai_greeting", value: "Hi there! Thanks for reaching out to AORNX. I'm the AI assistant. How can I help you today? You can ask me about our services, projects, or anything related to what we do.", type: "text" },
    { key: "auto_reply_ai_fallback", value: "Thank you for your message! Our team has been notified and will get back to you shortly. In the meantime, feel free to ask me anything else.", type: "text" },
    { key: "auto_reply_ai_personality", value: "You are a helpful AI assistant for AORNX, an AI SaaS agency specializing in custom software development, AI solutions, web development, automation, and digital transformation. You are friendly, professional, and knowledgeable about the company's services.", type: "text" },
    { key: "auto_reply_ai_knowledge", value: JSON.stringify([
      { keywords: "pricing cost how much price", response: "Our pricing varies depending on the scope and complexity of your project. We offer custom quotes tailored to your specific needs. Could you tell me more about what you're looking for? I'll connect you with our team for a detailed quote." },
      { keywords: "service services offer what do you do", response: "AORNX offers a wide range of services including AI Development, Web Development, Automation, UI/UX Design, SaaS Development, Backend Systems, AI Chatbots, and API Integration. What specific service are you interested in?" },
      { keywords: "contact email phone reach get in touch", response: "You can reach us through this chat, or email us at anirbanmajumderm@gmail.com. Our team typically responds within 24 hours." },
      { keywords: "project portfolio work examples", response: "We have worked on various projects including AI analytics platforms, fintech applications, e-commerce solutions, and healthcare platforms. You can check out our Projects section to see our work!" },
      { keywords: "timeline how long delivery time", response: "Project timelines depend on the scope and complexity. A typical web application takes 4-8 weeks, while more complex AI solutions may take 8-16 weeks. We'll provide a detailed timeline during our consultation." },
      { keywords: "technology stack tech react nextjs python", response: "We work with modern technologies including React, Next.js, TypeScript, Node.js, Python, TensorFlow, PostgreSQL, MongoDB, AWS, and more. We choose the best tech stack for each project's specific needs." },
      { keywords: "founder who created owner company", response: "AORNX was founded by Anirban Majumder, a full-stack developer and AI specialist with expertise in building modern scalable web applications." },
    ]), type: "text" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, type: s.type },
      create: s,
    });
  }

  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    const projectSeeds = [
      { title: "NovaAI Platform", slug: "novaai-platform", description: "Enterprise-grade AI-powered analytics platform serving 50K+ users with real-time insights and predictive modeling.", content: "A comprehensive AI analytics platform that processes millions of data points in real-time. Features include natural language querying, automated report generation, anomaly detection, and predictive analytics. Built with microservices architecture, the platform handles 10M+ daily API calls with 99.9% uptime.", technologies: "Next.js,Python,TensorFlow,PostgreSQL,Redis,Docker", projectUrl: "https://example.com", githubUrl: "https://github.com/example/novaai", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80", featured: true, order: 1, category: "AI/ML" },
      { title: "VaultFin Banking", slug: "vaultfin-banking", description: "Next-gen neobanking platform with real-time transactions, budgeting AI, and beautiful data visualizations.", content: "A full-stack neobanking application that provides real-time transaction processing, AI-powered budgeting insights, and intuitive financial dashboards. Implements robust security with end-to-end encryption, biometric authentication, and fraud detection algorithms.", technologies: "React,Node.js,MongoDB,AWS,Stripe,Chart.js", projectUrl: "https://example.com", githubUrl: "https://github.com/example/vaultfin", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", featured: true, order: 2, category: "FinTech" },
      { title: "Atlas Commerce", slug: "atlas-commerce", description: "Headless commerce platform powering 200+ stores with AI-driven personalization and global scalability.", content: "A headless ecommerce solution built for scale, featuring AI-powered product recommendations, dynamic pricing engines, multi-currency support, and real-time inventory management. Serves 200+ merchants across 30 countries with sub-100ms response times.", technologies: "Next.js,GraphQL,Shopify,Stripe,Vercel,Prisma", projectUrl: "https://example.com", githubUrl: "https://github.com/example/atlas", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80", featured: true, order: 3, category: "E-Commerce" },
      { title: "Pulse Health", slug: "pulse-health", description: "HIPAA-compliant telemedicine platform connecting patients with doctors via secure video consultations.", content: "A telemedicine platform that revolutionizes healthcare accessibility. Features include HIPAA-compliant video consultations, electronic health records management, prescription management, and AI-assisted diagnostic tools. Serves 500+ healthcare providers.", technologies: "React,WebRTC,Firebase,Node.js,PostgreSQL", projectUrl: "https://example.com", githubUrl: "https://github.com/example/pulse", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80", featured: false, order: 4, category: "HealthTech" },
      { title: "Quantum Dashboard", slug: "quantum-dashboard", description: "Real-time analytics dashboard for SaaS metrics with beautiful data viz and AI insights.", content: "A premium analytics dashboard designed for SaaS businesses. Provides real-time metrics visualization, cohort analysis, revenue tracking, and churn prediction using machine learning models. Handles millions of events per day.", technologies: "Next.js,TypeScript,D3.js,WebSocket,Python", projectUrl: "https://example.com", githubUrl: "https://github.com/example/quantum", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", featured: false, order: 5, category: "SaaS" },
      { title: "Beacon Social", slug: "beacon-social", description: "Creator-first social platform with Web3 integration, NFT galleries, and decentralized content.", content: "A decentralized social platform empowering creators with direct monetization, NFT integration, and community governance. Built on blockchain technology with features like token-gated content, creator DAOs, and cross-chain interoperability.", technologies: "Next.js,Solidity,IPFS,The Graph,TypeScript", projectUrl: "https://example.com", githubUrl: "https://github.com/example/beacon", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80", featured: false, order: 6, category: "Web3" },
    ];
    for (const p of projectSeeds) {
      await prisma.project.create({ data: p });
    }
    console.log("Projects seeded!");
  }

  const emailTemplates = [
    {
      name: "password-reset",
      subject: "Reset Your Password",
      body: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:40px 20px;">
<h1 style="color:#fff;font-size:24px;margin-bottom:16px;">Reset Your Password</h1>
<p style="color:#888;line-height:1.6;margin-bottom:24px;">Hi {{name}},</p>
<p style="color:#888;line-height:1.6;margin-bottom:24px;">We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.</p>
<div style="text-align:center;margin-bottom:32px;">
<a href="{{resetUrl}}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#f97316,#06b6d4);color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
</div>
<p style="color:#666;font-size:13px;line-height:1.6;">If you didn't request this, you can safely ignore this email. Your password won't change until you click the link above.</p>
</div>`,
      variables: "name,resetUrl",
    },
    {
      name: "contact-notification",
      subject: "New Contact Form Submission",
      body: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:40px 20px;">
<h1 style="color:#fff;font-size:24px;margin-bottom:16px;">New Contact Message</h1>
<p style="color:#888;line-height:1.6;margin-bottom:16px;">You've received a new message from your website contact form:</p>
<div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin-bottom:24px;">
<p style="color:#aaa;margin-bottom:8px;"><strong style="color:#fff;">Name:</strong> {{name}}</p>
<p style="color:#aaa;margin-bottom:8px;"><strong style="color:#fff;">Email:</strong> {{email}}</p>
<p style="color:#aaa;"><strong style="color:#fff;">Message:</strong></p>
<p style="color:#888;line-height:1.6;margin-top:8px;">{{message}}</p>
</div>
</div>`,
      variables: "name,email,message",
    },
    {
      name: "welcome",
      subject: "Welcome to the Admin Panel",
      body: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:40px 20px;">
<h1 style="color:#fff;font-size:24px;margin-bottom:16px;">Welcome, {{name}}!</h1>
<p style="color:#888;line-height:1.6;margin-bottom:24px;">Your admin account has been created. You can now log in to manage the website.</p>
<div style="text-align:center;margin-bottom:32px;">
<a href="{{loginUrl}}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#f97316,#06b6d4);color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Login to Dashboard</a>
</div>
</div>`,
      variables: "name,loginUrl",
    },
  ];

  for (const t of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: t.name },
      update: { subject: t.subject, body: t.body, variables: t.variables },
      create: t,
    });
  }
  console.log("Email templates seeded!");

  const packages = [
    { name: "Starter", description: "Basic package for small businesses", price: "$499", features: "Custom Website\n5 Pages\nMobile Responsive\nBasic SEO\n1 Month Support" },
    { name: "Professional", description: "Full-featured package for growing companies", price: "$1,499", features: "Custom Website\nUnlimited Pages\nMobile Responsive\nAdvanced SEO\nCMS Integration\n3 Months Support" },
    { name: "Enterprise", description: "Enterprise-grade solution with AI integration", price: "$3,999", features: "Custom Web App\nAI Integration\nAPI Development\nAdvanced Analytics\nPriority Support\n12 Months Support" },
  ];
  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({ where: { name: pkg.name } });
    if (!existing) {
      await prisma.package.create({ data: pkg });
    }
  }
  console.log("Packages seeded!");

  const knowledgeItems = [
    { question: "What services do you offer?", answer: "We offer custom web development, AI integration, mobile app development, cloud solutions, and digital transformation consulting.", category: "services", keywords: "services, offer, what do you do, products" },
    { question: "How much does a website cost?", answer: "Our pricing starts at $499 for a basic website and goes up to $3,999+ for enterprise solutions with AI integration. Contact us for a custom quote.", category: "pricing", keywords: "pricing, cost, price, how much, budget, rates" },
    { question: "What technologies do you use?", answer: "We specialize in Next.js, React, TypeScript, Node.js, PostgreSQL, Python, and various AI/ML frameworks. We choose the best tech stack for each project.", category: "technical", keywords: "technologies, tech stack, tools, programming languages, framework" },
    { question: "How long does a project take?", answer: "Typical project timelines range from 2-4 weeks for a basic website to 8-12+ weeks for complex AI-powered applications.", category: "services", keywords: "timeline, how long, delivery, deadline, turnaround" },
    { question: "Do you provide post-launch support?", answer: "Yes, we provide 1 month of free support with all packages and extended support options available for ongoing maintenance.", category: "support", keywords: "support, maintenance, post-launch, after delivery, updates" },
    { question: "What is your refund policy?", answer: "We offer a satisfaction guarantee. If you're not happy with the initial deliverables, we'll work with you to make it right.", category: "general", keywords: "refund, money back, guarantee, satisfaction, cancel" },
    { question: "Do you work with international clients?", answer: "Yes! We work with clients worldwide. Our team is fully remote and accustomed to working across different time zones.", category: "general", keywords: "international, remote, location, worldwide, global" },
  ];
  for (const item of knowledgeItems) {
    const existing = await prisma.knowledgeItem.findFirst({ where: { question: item.question } });
    if (!existing) {
      await prisma.knowledgeItem.create({ data: item });
    }
  }
  console.log("Knowledge items seeded!");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
