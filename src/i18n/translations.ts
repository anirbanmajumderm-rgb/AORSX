type TranslationValue = string | string[] | Record<string, unknown>;

interface TranslationSection {
  [key: string]: TranslationValue | TranslationSection;
}

interface Translations {
  [lang: string]: TranslationSection;
}

export const translations: Translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      projects: "Projects",
      reviews: "Reviews",
      skills: "Skills",
      faq: "FAQ",
      contact: "Contact",
      letsWorkTogether: "Let's Work Together",
    },
    hero: {
      badge: "Next-Gen AI Agency",
      title: ["WE BUILD", "YOU GROW", ""],
      description:
        "We engineer cutting-edge AI solutions, web platforms, and automation systems that transform businesses into digital powerhouses.",
      viewProjects: "View Projects",
      talkWithUs: "Talk With Us",
    },
    about: {
      title: "About Us",
      subtitle: "We are a team of engineers, designers, and dreamers building the next generation of digital experiences.",
      mission: "To democratize AI technology and make it accessible for every business to thrive in the digital age.",
      vision: "A world where AI empowers every business to reach its full potential, breaking barriers of complexity and cost.",
      values: [
        {
          title: "Innovation First",
          description: "We push boundaries and embrace emerging technologies to deliver future-proof solutions.",
        },
        {
          title: "Excellence Always",
          description: "Every line of code, every pixel, every interaction is crafted with uncompromising quality.",
        },
        {
          title: "Client Centric",
          description: "Your success is our success. We partner closely to understand and achieve your vision.",
        },
        {
          title: "Transparency",
          description: "Open communication, honest timelines, and clear reporting every step of the way.",
        },
      ],
    },
    founders: {
      title: "Meet the Founders",
      subtitle: "Visionaries driving innovation in AI and digital engineering.",
      founderName: "Founder",
      founderRole: "CEO & Founder",
    },
    stats: {
      projectsDelivered: "Projects Delivered",
      happyClients: "Happy Clients",
      yearsExperience: "Years Experience",
      satisfaction: "Satisfaction Rate",
      support: "24/7 Support",
    },
    services: {
      title: "Our Services",
      subtitle: "From AI-powered automation to stunning web experiences, we deliver end-to-end digital solutions.",
      items: [
        { name: "AI Development", description: "Custom machine learning models, NLP systems, and intelligent automation tailored to your business needs." },
        { name: "Web Development", description: "High-performance websites and web applications built with modern frameworks and best practices." },
        { name: "Automation", description: "Streamline your workflows with intelligent bots, automated pipelines, and smart process optimization." },
        { name: "UI/UX Design", description: "Beautiful, intuitive interfaces designed to delight users and drive engagement." },
        { name: "SaaS Development", description: "Scalable software-as-a-service platforms from concept to launch and beyond." },
        { name: "Backend Systems", description: "Robust server-side architecture, APIs, and cloud infrastructure built for scale." },
        { name: "AI Chatbots", description: "Intelligent conversational agents that understand context, learn from interactions, and provide real value." },
        { name: "API Integration", description: "Seamless integration of third-party services, payment gateways, and external APIs." },
      ],
    },
    projects: {
      title: "Featured Projects",
      subtitle: "Showcasing our best work across AI, web, and automation.",
      viewAll: "View All Projects",
    },
    reviews: {
      title: "Client Reviews",
      subtitle: "Hear what our clients have to say about working with us.",
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Got questions? We've got answers. If you don't find what you're looking for, reach out to us.",
      askQuestion: "Ask a Question",
      submit: "Submit",
      name: "Your Name",
      email: "Email Address",
      phone: "Phone Number",
      yourQuestion: "Your Question",
    },
    contact: {
      title: "Get In Touch",
      subtitle: "Ready to transform your business? Let's talk about your next project.",
      email: "",
      phone: "",
      address: "",
      sendMessage: "Send Message",
      yourName: "Your Name",
      yourEmail: "Your Email",
      subject: "Subject",
      message: "Message",
      successMessage: "Thank you! We'll get back to you within 24 hours.",
    },
    footer: {
      copyright: "\u00A9",
      rights: "All rights reserved.",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      navigation: "Navigation",
      social: "Follow Us",
      stayUpdated: "Stay updated",
    },
    ai: {
      greeting: "Hello! I'm the AI assistant.",
      initialMessage: "How can I help you today? Ask me about our services, projects, or anything else!",
    },
  },
  bn: {
    nav: {
      home: "হোম",
      about: "আমাদের সম্পর্কে",
      services: "সেবাসমূহ",
      projects: "প্রকল্প",
      reviews: "রিভিউ",
      skills: "দক্ষতা",
      faq: "প্রশ্নোত্তর",
      contact: "যোগাযোগ",
      letsWorkTogether: "আসুন একসাথে কাজ করি",
    },
    hero: {
      badge: "নেক্সট-জেন এআই এজেন্সি",
      title: ["এআই দিয়ে", "ভবিষ্যৎ", "গঠন করুন"],
      description:
        "আমরা অত্যাধুনিক এআই সমাধান, ওয়েব প্ল্যাটফর্ম এবং অটোমেশন সিস্টেম তৈরি করি যা ব্যবসাকে ডিজিটাল পাওয়ারহাউসে রূপান্তরিত করে।",
      viewProjects: "প্রকল্প দেখুন",
      talkWithUs: "আমাদের সাথে কথা বলুন",
    },
    about: {
      title: "আমাদের সম্পর্কে",
      subtitle: "আমরা ইঞ্জিনিয়ার, ডিজাইনার এবং স্বপ্নদ্রষ্টাদের একটি দল যারা ডিজিটাল অভিজ্ঞতার পরবর্তী প্রজন্ম তৈরি করছে।",
      mission: "এআই প্রযুক্তিকে গণতন্ত্রীকরণ করা এবং ডিজিটাল যুগে প্রতিটি ব্যবসার উন্নতির জন্য এটি অ্যাক্সেসযোগ্য করে তোলা।",
      vision: "এমন একটি বিশ্ব যেখানে এআই প্রতিটি ব্যবসাকে তার পূর্ণ সম্ভাবনায় পৌঁছাতে সক্ষম করে, জটিলতা এবং খরচের বাধা ভেঙে।",
      values: [
        {
          title: "প্রথমেই উদ্ভাবন",
          description: "আমরা সীমানা ঠেলে দেই এবং ভবিষ্যৎ-প্রস্তুত সমাধান প্রদানের জন্য উদীয়মান প্রযুক্তি গ্রহণ করি।",
        },
        {
          title: "সর্বদা উৎকর্ষতা",
          description: "প্রতি লাইন কোড, প্রতি পিক্সেল, প্রতি ইন্টারঅ্যাকশন আপোষহীন মানের সাথে তৈরি।",
        },
        {
          title: "ক্লায়েন্ট কেন্দ্রিক",
          description: "আপনার সাফল্যই আমাদের সাফল্য। আমরা আপনার দৃষ্টিভঙ্গি বুঝতে এবং অর্জন করতে ঘনিষ্ঠভাবে অংশীদারিত্ব করি।",
        },
        {
          title: "স্বচ্ছতা",
          description: "প্রতিটি ধাপে খোলা যোগাযোগ, সৎ সময়সীমা এবং পরিষ্কার রিপোর্টিং।",
        },
      ],
    },
    founders: {
      title: "প্রতিষ্ঠাতাদের সাথে পরিচিত হন",
      subtitle: "এআই এবং ডিজিটাল ইঞ্জিনিয়ারিংয়ে উদ্ভাবন চালানো দূরদর্শীরা।",
      founderName: "প্রতিষ্ঠাতা",
      founderRole: "সিইও ও প্রতিষ্ঠাতা",
    },
    stats: {
      projectsDelivered: "প্রকল্প সম্পন্ন",
      happyClients: "সন্তুষ্ট ক্লায়েন্ট",
      yearsExperience: "বছরের অভিজ্ঞতা",
      satisfaction: "সন্তুষ্টির হার",
      support: "২৪/৭ সহায়তা",
    },
    services: {
      title: "আমাদের সেবাসমূহ",
      subtitle: "এআই-চালিত অটোমেশন থেকে চমৎকার ওয়েব অভিজ্ঞতা, আমরা শেষ পর্যন্ত ডিজিটাল সমাধান প্রদান করি।",
      items: [
        { name: "এআই ডেভেলপমেন্ট", description: "আপনার ব্যবসার প্রয়োজন অনুসারে কাস্টম মেশিন লার্নিং মডেল, এনএলপি সিস্টেম এবং বুদ্ধিমান অটোমেশন।" },
        { name: "ওয়েব ডেভেলপমেন্ট", description: "আধুনিক ফ্রেমওয়ার্ক এবং সর্বোত্তম অনুশীলনের সাথে তৈরি উচ্চ-কার্যক্ষমতা সম্পন্ন ওয়েবসাইট এবং ওয়েব অ্যাপ্লিকেশন।" },
        { name: "অটোমেশন", description: "বুদ্ধিমান বট, স্বয়ংক্রিয় পাইপলাইন এবং স্মার্ট প্রক্রিয়া অপ্টিমাইজেশনের মাধ্যমে আপনার কর্মপ্রবাহকে সুবিন্যস্ত করুন।" },
        { name: "ইউআই/ইউএক্স ডিজাইন", description: "সুন্দর, স্বজ্ঞাত ইন্টারফেস যা ব্যবহারকারীদের আনন্দিত করে এবং ব্যস্ততা বাড়ায়।" },
        { name: "সাস ডেভেলপমেন্ট", description: "ধারণা থেকে লঞ্চ এবং তার পরেও স্কেলেবল সফটওয়্যার-অ্যাজ-এ-সার্ভিস প্ল্যাটফর্ম।" },
        { name: "ব্যাকএন্ড সিস্টেম", description: "স্কেলের জন্য তৈরি শক্তিশালী সার্ভার-সাইড আর্কিটেকচার, এপিআই এবং ক্লাউড অবকাঠামো।" },
        { name: "এআই চ্যাটবট", description: "বুদ্ধিমান কথোপকথনমূলক এজেন্ট যা প্রসঙ্গ বোঝে, মিথস্ক্রিয়া থেকে শেখে এবং বাস্তব মূল্য প্রদান করে।" },
        { name: "এপিআই ইন্টিগ্রেশন", description: "থার্ড-পার্টি সার্ভিস, পেমেন্ট গেটওয়ে এবং বাহ্যিক এপিআই-এর নিরবচ্ছিন্ন সংহতকরণ।" },
      ],
    },
    projects: {
      title: "উল্লেখযোগ্য প্রকল্প",
      subtitle: "এআই, ওয়েব এবং অটোমেশনে আমাদের সেরা কাজের প্রদর্শনী।",
      viewAll: "সব প্রকল্প দেখুন",
    },
    reviews: {
      title: "ক্লায়েন্ট রিভিউ",
      subtitle: "আমাদের সাথে কাজ করার বিষয়ে আমাদের ক্লায়েন্টরা কী বলে তা শুনুন।",
    },
    faq: {
      title: "সচরাচর জিজ্ঞাসিত প্রশ্ন",
      subtitle: "প্রশ্ন আছে? আমাদের উত্তর আছে। আপনি যা খুঁজছেন তা যদি না পান, আমাদের সাথে যোগাযোগ করুন।",
      askQuestion: "প্রশ্ন জিজ্ঞাসা করুন",
      submit: "জমা দিন",
      name: "আপনার নাম",
      email: "ইমেইল ঠিকানা",
      phone: "ফোন নম্বর",
      yourQuestion: "আপনার প্রশ্ন",
    },
    contact: {
      title: "যোগাযোগ করুন",
      subtitle: "আপনার ব্যবসাকে রূপান্তর করতে প্রস্তুত? আপনার পরবর্তী প্রকল্প সম্পর্কে কথা বলি।",
      email: "",
      phone: "",
      address: "",
      sendMessage: "বার্তা পাঠান",
      yourName: "আপনার নাম",
      yourEmail: "আপনার ইমেইল",
      subject: "বিষয়",
      message: "বার্তা",
      successMessage: "ধন্যবাদ! আমরা ২৪ ঘন্টার মধ্যে আপনার সাথে যোগাযোগ করব।",
    },
    footer: {
      copyright: "\u00A9",
      rights: "সর্বস্বত্ব সংরক্ষিত।",
      terms: "পরিষেবার শর্তাবলী",
      privacy: "গোপনীয়তা নীতি",
      navigation: "ন্যাভিগেশন",
      social: "আমাদের অনুসরণ করুন",
      stayUpdated: "আপডেট থাকুন",
    },
    ai: {
      greeting: "হ্যালো! আমি এআই সহায়ক।",
      initialMessage: "আমি আজ আপনাকে কীভাবে সাহায্য করতে পারি? আমাদের পরিষেবা, প্রকল্প বা অন্য কিছু সম্পর্কে জিজ্ঞাসা করুন!",
    },
  },
};

export const defaultLang = "en";

export const languages = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
];

export function getTranslation(lang: string, key: string): string {
  const keys = key.split(".");
  let result: unknown = translations[lang];

  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof result === "string") {
    return result;
  }

  if (Array.isArray(result)) {
    return (result as unknown[]).map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return Object.values(item as Record<string, unknown>).join(" ");
      }
      return String(item);
    }).join(" ");
  }

  return key;
}
