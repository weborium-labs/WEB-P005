import "../load-env.js";
import mongoose from "mongoose";
import { connectToDatabase } from "../config/database.js";
import { Page, type ISection } from "../models/page.model.js";

/**
 * Seeds the page-level CMS documents.
 *
 * The seed content mirrors the frontend's static fallback copy verbatim, so
 * running it produces no visual change on the public site — the first API
 * response simply matches what was already rendered.
 *
 * Usage:
 *   node dist/scripts/seed-pages.js          # create missing pages only
 *   node dist/scripts/seed-pages.js --force  # overwrite existing pages too
 */

const FORCE = process.argv.includes("--force");

const AVATAR =
  "https://pub-4288b22fbd4c41f8ae1e48c844c96685.r2.dev/weborium/Dr.%20Davinder%20Paul%20Singh.jpeg";

const BIO =
  'Dr. Davinder Paul Singh is currently working as an Assistant Professor in the Department of Computer Science and Engineering at Pandit Deendayal Energy University, Gandhinagar, Gujarat. He has completed his Ph.D. from Shri Mata Vaishno Devi University, Katra, Jammu and Kashmir. He has also qualified UGC- NET JRF in computer science with All India Rank 100. He has published various articles in SCI journals and International Conferences of repute. Dr. Davinder Paul Singh has also won several best paper presentation awards including "Best Paper Award" for his CSI article. His primary areas of interest include Artificial Intelligence, Machine Learning, Deep Learning, Computational Biology and Drug Discovery.';

const HERO_DESCRIPTION =
  "Computer Science researcher and educator specializing in AI, deep learning, medical imaging, and computational approaches to healthcare, with a focus on translating research into intelligent solutions.";

const CONTACT_DESCRIPTION =
  "I’m open to considered academic conversations across machine learning, healthcare, and interdisciplinary research.";

interface SeedPage {
  slug: string;
  title: string;
  seo: { title: string; description: string; keywords: string[] };
  sections: ISection[];
}

const section = (
  key: string,
  type: ISection["type"],
  order: number,
  fields: Partial<ISection>,
): ISection => ({ key, type, order, visible: true, ...fields });

const heroSection = (order = 0): ISection =>
  section("hero", "hero", order, {
    headline: ["Researching Intelligence.", "Building Impact."],
    description: HERO_DESCRIPTION,
    image: { url: AVATAR, alt: "Dr. Davinder Paul Singh" },
    primaryButton: { label: "View Research", href: "/publications" },
    secondaryButton: { label: "View Resume", href: "/resume.pdf" },
    items: [
      { label: "Google Scholar", href: "https://scholar.google.com", icon: "scholar" },
      { label: "LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
    ],
  });

const aboutSection = (order = 1): ISection =>
  section("about", "about", order, {
    heading: "Research with rigour, teaching with purpose",
    description: BIO,
    stats: [
      { value: "24+", label: "Journal Papers" },
      { value: "23+", label: "Conference Papers" },
      { value: "2", label: "Patents Granted" },
      { value: "7", label: "Patents Published" },
    ],
    cta: { label: "View About Me", href: "/about" },
    subtitle: "Latest",
    items: [
      { title: "Published new research in leading SCIE-indexed journals." },
      { title: "Contributed to new research in AI-driven cancer diagnosis and medical imaging." },
      { title: "Filed new patents focused on AI and IoT-based healthcare solutions." },
    ],
  });

const journeySection = (key: string, order: number): ISection =>
  section(key, "milestones", order, {
    heading: "Journey",
    items: [
      { label: "2014", title: "B.E., IT", subtitle: "(University of Jammu - 70%)" },
      { label: "2017", title: "M.Tech., CSE", subtitle: "(University of Jammu - 8.31 CGPA)" },
      {
        label: "2018",
        title: "Contractual Asst. Professor",
        subtitle: "(Yogananda College of Engineering & Technology)",
      },
      {
        label: "2018 - 2023",
        title: "Ph.D. Scholar",
        subtitle: "(Shri Mata Vaishno Devi University)",
      },
      {
        label: "2023-Present",
        title: "Asst. Professor",
        subtitle: "(Pandit Deendayal Energy University)",
      },
    ],
  });

const textSection = (
  key: string,
  order: number,
  heading: string,
  description: string,
  extra: Partial<ISection> = {},
): ISection => section(key, "text", order, { heading, description, ...extra });

const PAGES: SeedPage[] = [
  {
    slug: "home",
    title: "Home",
    seo: {
      title: "Dr. Davinder Paul Singh",
      description: HERO_DESCRIPTION,
      keywords: ["AI", "Deep Learning", "Medical Imaging", "Computational Biology"],
    },
    sections: [
      heroSection(0),
      aboutSection(1),
      section("interests", "interests", 2, {
        heading: "Research Interests",
        items: [
          {
            title: "Machine & Deep Learning",
            description:
              "Hybrid, attention-based and ensemble models for classification and prediction.",
            icon: "machine-learning",
          },
          {
            title: "Medical Imaging",
            description:
              "Segmentation and classification across cancer, retinal, thyroid and brain imaging.",
            icon: "medical-imaging",
          },
          {
            title: "Computational Biology",
            description: "Computational methods for biological sequences and disease control.",
            icon: "computational-biology",
          },
          {
            title: "AI in Healthcare",
            description:
              "AI-driven diagnosis, clinical text analysis and anti-cancer drug response.",
            icon: "ai-healthcare",
          },
        ],
      }),
      section("selected-research", "list", 3, {
        heading: "Selected Research",
        items: [
          {
            label: "journal - 2026",
            title:
              "A Comprehensive Study to Enhance Colorectal Cancer Diagnosis Using Hybrid Deep Learning Approaches: Comparative Analysis with Existing State of the Art Techniques",
            subtitle: "Archives of Computational Methods in Engineering SCIE IF 12.9",
          },
          {
            label: "conference - 2025",
            title:
              "AI enabled healthcare systems using textual data with a BERT and deep learning model",
            subtitle: "IEEE ICERECT 2025",
          },
          {
            label: "journal - 2023",
            title:
              "CTDN (convolutional temporal based deep neural network): an improvised stacked hybrid computational approach for anticancer drug response prediction",
            subtitle: "Computational Biology and Chemistry 105",
          },
        ],
      }),
      section("selected-patents", "list", 4, {
        heading: "Selected Patents",
        items: [
          {
            label: "granted",
            title: "AI-powered mood detection wrist band for children",
            subtitle: "Application No. 466626-001",
          },
          {
            label: "granted",
            title: "AI based gesture control system for medical drones",
            subtitle: "Application No. 466582-001",
          },
          {
            label: "published",
            title:
              "Machine Learning based Single-Cell RNA Sequencing for Targeted Anticancer Drug Discovery",
            subtitle: "Application No. 202421052344",
          },
        ],
      }),
      journeySection("journey", 5),
    ],
  },
  {
    slug: "about",
    title: "About",
    seo: {
      title: "About — Dr. Davinder Paul Singh",
      description: BIO.slice(0, 300),
      keywords: ["About", "Assistant Professor", "PDEU"],
    },
    sections: [heroSection(0), aboutSection(1), journeySection("journey", 2)],
  },
  {
    slug: "contact",
    title: "Contact",
    seo: {
      title: "Contact — Dr. Davinder Paul Singh",
      description: CONTACT_DESCRIPTION,
      keywords: ["Contact", "Collaboration", "Research"],
    },
    sections: [
      section("contact", "cta", 0, {
        heading: "Interested in collaborating or discussing my research?",
        description: CONTACT_DESCRIPTION,
        cta: { label: "Get in Touch", href: "/contact" },
      }),
    ],
  },
  {
    slug: "footer",
    title: "Site Footer",
    seo: { title: "", description: "", keywords: [] },
    sections: [
      section("footer", "footer", 0, {
        heading: "Dr. Davinder Paul Singh",
        description:
          "Assistant Professor, Department of Computer Science & Engineering - PDEU, Gandhinagar, Gujarat",
        body: "Last Updated - October 2026",
        subtitle: "Dr. Davinder Paul Singh © 2026",
        items: [
          {
            label: "Pages",
            children: [
              { label: "Home", href: "/" },
              { label: "About", href: "/about" },
              { label: "Mentorship", href: "/mentorship" },
            ],
          },
          {
            label: "Research",
            children: [
              { label: "Research Interests", href: "/research/interests" },
              { label: "Publications", href: "/publications" },
              { label: "Patents", href: "/research/patents" },
              {
                label: "Editorial & Review Services",
                href: "/page/editorial-board-memberships",
              },
            ],
          },
          {
            label: "Teaching",
            children: [
              { label: "Courses Taught", href: "/teaching/courses" },
              { label: "Glimpses", href: "/glimpses" },
            ],
          },
          {
            label: "Connect",
            children: [
              { label: "Google Scholar", href: "https://scholar.google.com", external: true },
              { label: "LinkedIn", href: "https://www.linkedin.com", external: true },
            ],
          },
        ],
      }),
    ],
  },
  {
    slug: "site",
    title: "Site Settings",
    seo: { title: "Dr. Davinder Paul Singh", description: HERO_DESCRIPTION, keywords: [] },
    sections: [
      section("header", "chrome", 0, {
        image: { url: AVATAR, alt: "Profile" },
        primaryButton: { label: "Get in Touch", href: "/contact" },
      }),
    ],
  },
  {
    slug: "publications",
    title: "Publications",
    seo: {
      title: "Publications — Dr. Davinder Paul Singh",
      description: "Journal and conference publications by Dr. Davinder Paul Singh.",
      keywords: ["Publications", "Journal Papers", "Conference Papers"],
    },
    sections: [
      textSection("header", 0, "Publications", "Journal and conference papers, newest first."),
    ],
  },
  {
    slug: "glimpses",
    title: "Glimpses",
    seo: {
      title: "Glimpses — Dr. Davinder Paul Singh",
      description: "Moments, academic sessions, and campus interactions.",
      keywords: ["Glimpses", "Gallery", "Campus"],
    },
    sections: [
      textSection(
        "header",
        0,
        "Glimpses",
        "Moments, academic sessions, and campus interactions.",
      ),
    ],
  },
  {
    slug: "research-interests",
    title: "Research Interests",
    seo: {
      title: "Research Interests — Dr. Davinder Paul Singh",
      description:
        "Machine and deep learning, medical imaging, computational biology and AI in healthcare.",
      keywords: ["Research Interests", "Machine Learning", "Medical Imaging"],
    },
    sections: [textSection("header", 0, "Research Interests", "")],
  },
  {
    slug: "courses-taught",
    title: "Courses Taught",
    seo: {
      title: "Courses Taught — Dr. Davinder Paul Singh",
      description: "Undergraduate and postgraduate courses taught by Dr. Davinder Paul Singh.",
      keywords: ["Courses", "Teaching"],
    },
    sections: [textSection("header", 0, "Courses Taught", "")],
  },
  {
    slug: "mentorship",
    title: "Mentorship",
    seo: {
      title: "Mentorship — Dr. Davinder Paul Singh",
      description: "Students and projects supervised by Dr. Davinder Paul Singh.",
      keywords: ["Mentorship", "Supervision", "Students"],
    },
    sections: [
      section("header", "text", 0, {
        heading: "Mentorship",
        stats: [{ value: "10+", label: "Students Mentored" }],
        description:
          "I have guided students and early-career researchers across numerous research publications, projects, and academic outcomes. A dedicated directory of supervised students and projects will be listed here once finalized.",
      }),
    ],
  },
  {
    slug: "patents",
    title: "Patents",
    seo: {
      title: "Patents — Dr. Davinder Paul Singh",
      description: "Granted and published patents of Dr. Davinder Paul Singh.",
      keywords: ["Patents", "Granted", "Published"],
    },
    sections: [textSection("header", 0, "Patents", "")],
  },
  {
    slug: "editorial-board-memberships",
    title: "Editorial Board Memberships",
    seo: {
      title: "Editorial Board Memberships — Dr. Davinder Paul Singh",
      description: "Editorial board and review service roles.",
      keywords: ["Editorial Board", "Review Service"],
    },
    sections: [textSection("header", 0, "Editorial Board Memberships", "")],
  },
];

const resolveOwnerId = async (): Promise<string> => {
  const users = await mongoose.connection.db
    ?.collection("users")
    .find({ role: "admin" })
    .toArray();

  // Prefer the account that already owns the seeded content.
  const preferred = users?.find((user) => String(user._id) === "6ad46120cd27224b927ea8bc");
  const owner = preferred ?? users?.[0];

  if (!owner) {
    throw new Error("No admin user exists yet — sign in through Google OAuth first.");
  }
  return String(owner._id);
};

const run = async (): Promise<void> => {
  await connectToDatabase();
  const ownerId = await resolveOwnerId();

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const seed of PAGES) {
    const existing = await Page.findOne({ slug: seed.slug });

    if (existing && !FORCE) {
      skipped += 1;
      console.log(`  = ${seed.slug} (already exists, use --force to overwrite)`);
      continue;
    }

    const payload = {
      slug: seed.slug,
      title: seed.title,
      status: "published" as const,
      content: { sections: seed.sections },
      seo: seed.seo,
      user_id: ownerId,
      version: 1,
    };

    if (existing) {
      // Preserve identity: update in place by _id so the stable document ID,
      // creation timestamp and any inbound links survive the re-seed.
      await Page.updateOne(
        { _id: existing._id },
        {
          $set: {
            title: payload.title,
            status: payload.status,
            "content.sections": payload.content.sections,
            "seo.title": payload.seo.title,
            "seo.description": payload.seo.description,
            "seo.keywords": payload.seo.keywords,
          },
          $setOnInsert: { slug: payload.slug },
          $inc: { version: 1 },
        },
      );
      updated += 1;
      console.log(`  ~ ${seed.slug} (updated in place, _id preserved)`);
      continue;
    }

    await Page.create(payload);
    created += 1;
    console.log(`  + ${seed.slug}`);
  }

  console.log(
    `\nSeed complete — ${created} created, ${updated} updated, ${skipped} left untouched.`,
  );
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Seed failed:", error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
