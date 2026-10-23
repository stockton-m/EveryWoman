import { NASM_URL } from "./coaching";

export type AboutInline =
  | string
  | { kind: "em"; text: string }
  | { kind: "link"; text: string; href: string };

export type AboutBlock =
  | { kind: "paragraph"; content: AboutInline[] }
  | { kind: "heading"; text: string }
  | { kind: "image" };

export type AboutProfile = {
  role: string;
  name: string;
  paragraphs: AboutInline[][];
  accent: "orange" | "green" | "pink";
};

export type AboutCollageItem = {
  id: "artist" | "dog" | "podcast" | "coffee" | "fear" | "hobby";
  title: string;
  description: AboutInline[];
  accent: "orange" | "green" | "brown" | "pink";
  layout: "feature" | "left" | "upperRight" | "right" | "lowerLeft" | "lowerMiddle";
};

const EMMELINE_URL = "https://www.emmelineventures.vc/";

function em(text: string): AboutInline {
  return { kind: "em", text };
}

function link(text: string, href: string): AboutInline {
  return { kind: "link", text, href };
}

function paragraph(...content: AboutInline[]): AboutBlock {
  return { kind: "paragraph", content };
}

export const ABOUT_BACKGROUND = {
  lead: {
    before: "I started ",
    emphasis: "EveryWoman",
    after: " because...",
  },
  signoff: "—M.",
  left: [
    paragraph(
      "…no one could tell me what was wrong with my body, and I got tired of being the only one looking.",
    ),
    paragraph(
      "For years I had symptoms that didn’t fit anywhere. Between pelvic pain with no pattern, migraines with aura that ended in hours of vomiting, and fatigue that sleep didn’t fix, I was exhausted by doctor after doctor telling me that everything looked fine on paper while I was suffering. It wasn’t until an emergency appendectomy that a surgeon unexpectedly found what had been there all along: ",
      em("advanced endometriosis spread throughout my abdomen."),
    ),
    paragraph(
      "Until my diagnosis, I had never heard of endometriosis. I was rapidly thrust into a world I did not volunteer for. What followed my diagnosis was multiple more surgeries, months of chronic infections, and me walking down an unknown path of the American medical system, feeling more alone than ever. The life I previously knew was gone. I mourned my health and the body I thought I knew.",
    ),
    paragraph(
      "Through the turbulence, movement is what kept me going. Some days it was just a walk around the neighborhood. Other days it was swimming in the ocean, pelvic floor PT, or lifting weights. I learned how to invest in my future self with strength training and mobility, and I learned that my recovery as someone with endometriosis doesn’t follow the standard script for men or others without chronic health conditions.",
    ),
    paragraph(
      "Over time, I notice how little of the fitness world was built for bodies like mine. Programs assumed you’d feel the same every week. Coaches assumed pain was always a sign of progress. Most trainers I’d encountered were either men training men or women training only for weight loss. I realized my medical care and my training lived in two separate worlds.",
    ),
  ],
  right: [
    paragraph(
      "EveryWoman is what I wanted back then. Strength training and movement built around ",
      em("your actual body"),
      ". ",
      em("Your"),
      " body, meaning ",
      em("your"),
      " endo, ",
      em("your"),
      " PCOS/PMOS, ",
      em("your"),
      " pregnancy and postpartum, ",
      em("your"),
      " perimenopause and menopause, ",
      em("your"),
      " flare ups, ",
      em("your"),
      " “I just feel off” days, and ",
      em("your"),
      " symptoms. At EveryWoman, we plan for the flare weeks. We adjust when life happens. You don’t have to earn rest here.",
    ),
    { kind: "image" } as const,
    { kind: "heading", text: "A little more about me" } as const,
    paragraph(
      "I’m a ",
      link("NASM", NASM_URL),
      " Certified Personal Trainer and a lifelong athlete.",
    ),
    paragraph(
      "Before coaching, I spent my career in private equity, venture capital, and as a chief of staff. That’s where my love of systems comes from: tracking what’s working, adjusting what isn’t, and building plans that hold up during a busy week. I know what it's like to balance work, health, family, and life's responsibilities.",
    ),
    paragraph(
      "I’m not a dietitian, and I’m not your doctor. I work in tandem with existing care teams to help you get strong alongside them, and I’ll help you push back when you’re not getting the care you deserve.",
    ),
  ],
};

export const ABOUT_ETHOS_INTRO =
  "EveryWoman is shaped by generous teachers, thoughtful collaborators, and the women who inspired Madeleine to build it. A few key individuals are highlighted here, though many more women have influenced and supported Madeleine on her journey.";

export const ABOUT_PROFILES: AboutProfile[] = [
  {
    role: "Coach & Collaborator",
    name: "Loretta Hogg",
    accent: "green",
    paragraphs: [
      [
        "Loretta Hogg is a high performance coach and host of the ",
        link(
          "Loretta Loves Lifting Podcast",
          "https://www.lorettaloveslifting.com/podcast",
        ),
        " (listen on ",
        link("Spotify", "https://open.spotify.com/show/033d0DrI4Z1toNfvtuRTTJ"),
        "), where she translates elite training principles into practical strategies for women’s strength, recovery, and long-term health. Loretta's fitness journey began in surf life-saving, open water swimming, and cross-country. While she no longer competes, her passion remains strong through running, swimming, and strength training — fueling her dedication to her clients. As a ",
        link(
          "NZSCA Level 3 S&C coach",
          "https://sesnz.org.nz/accreditation/strength-and-conditioning/",
        ),
        " with a Master of Sport and Exercise and experience supporting athletes across more than 30 sports including Olympic-level competition, Loretta brings rare credibility to conversations around performance across the female lifespan. Additionally, her ongoing work with Dr. Stacy Sims keeps her training grounded in the latest research on women’s health and physiology.",
      ],
      ["Madeleine and Loretta have trained together for over a year."],
    ],
  },
  {
    role: "Mentor & Investor",
    name: "La Keisha Landrum Pierre",
    accent: "orange",
    paragraphs: [
      [
        "La Keisha Landrum Pierre is a purpose-driven investor, strategic operator, and three-time founder who brings clarity and structure to complexity. In her career she’s focused on reshaping industries and building systems that create financial and societal impact at scale.",
      ],
      [
        "La Keisha is a general partner and co-founder of ",
        link("Emmeline Ventures", EMMELINE_URL),
        " where she leads an investment firm investing in women-led businesses driving innovation in women’s health, wealth, and well-being. La Keisha is also the executive chairwoman of the ",
        link("Civic Media Lab", "https://www.civicmedialab.ng/"),
        ", an initiative she co-founded in partnership with ",
        link("Omidyar Network", "https://omidyar.com/"),
        ", ",
        link("Luminate", "https://luminategroup.com/"),
        ", ",
        link("MacArthur Foundation", "https://www.macfound.org/"),
        ", and the ",
        link("National Endowment for Democracy", "https://www.ned.org/"),
        ".",
      ],
      [
        "Madeleine is an investor in her fund, and has collaborated with La Keisha since 2023.",
      ],
    ],
  },
  {
    role: "Inspiration",
    name: "Dr. Stacy Sims",
    accent: "pink",
    paragraphs: [
      [
        "Dr. Stacy Sims helps active women and the people who work with them (coaches, physical therapists, parents, doctors, PhDs, allied health practitioners, teachers, and more) take back control of their lives, their bodies, and their health through better understanding backed by science. She wrote her book ",
        link("ROAR", "https://www.drstacysims.com/roar"),
        " and created her signature course ",
        link("WOMEN ARE NOT SMALL MEN", "https://www.drstacysims.com/wansm"),
        " because she saw the appalling lack of research done specifically on women in regards to exercise, nutrition, and medicine.",
      ],
      [
        "Her vision is a world of healthy women who understand and know how to work with their bodies, cut through the taboo of periods and menopause, and create positivity around being a woman in sport. Dr. Sims has directed research programs at Stanford, AUT University, and the University of Waikato, focusing on female athlete health, performance, and pushing the dogma to improve research on all women. She has published over ",
        link(
          "100 peer-reviewed papers",
          "https://scholar.google.com/citations?user=xrYMd00AAAAJ&hl=en",
        ),
        " and is a regularly featured speaker at professional and academic conferences.",
      ],
      [
        "Madeleine has been following Dr. Stacy Sims since 2023 and currently works with Loretta Hogg (one of her longtime collaborators).",
      ],
    ],
  },
];

export const ABOUT_COLLAGE_ITEMS: AboutCollageItem[] = [
  {
    id: "artist",
    title: "My uniform",
    description: ["Nike Dunks, my favorite shoes to deadlift & squat in"],
    accent: "orange",
    layout: "feature",
  },
  {
    id: "coffee",
    title: "My fav podcast",
    description: ["Diabolical Lies, a feminist podcast about politics & culture"],
    accent: "green",
    layout: "left",
  },
  {
    id: "dog",
    title: "My training partner",
    description: ["My dog Pippa, the unofficial EveryWoman teammate and mascot"],
    accent: "pink",
    layout: "upperRight",
  },
  {
    id: "podcast",
    title: "My unwind",
    description: ["An episode of The Real Housewives and nowhere else to be"],
    accent: "orange",
    layout: "right",
  },
  {
    id: "fear",
    title: "My swimming paradise",
    description: ["The ocean, specifically the west coast in July"],
    accent: "pink",
    layout: "lowerLeft",
  },
  {
    id: "hobby",
    title: "My passion",
    description: [
      "Women founders, I’m a current investor\u00A0in\u00A0",
      link("Emmeline\nVentures", EMMELINE_URL),
    ],
    accent: "green",
    layout: "lowerMiddle",
  },
];
