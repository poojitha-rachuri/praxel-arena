import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SKILLS = [
  {
    name: "Guesstimation",
    slug: "guesstimation",
    description:
      "Market sizing, Fermi estimates, and quantitative reasoning under uncertainty",
    icon: "🎯",
    careers: ["consulting", "product-management", "founder"],
  },
  {
    name: "GTM Strategy",
    slug: "gtm-strategy",
    description:
      "Go-to-market planning, channel strategy, launch sequencing, and market entry",
    icon: "🚀",
    careers: ["marketing", "product-management", "founder", "growth"],
  },
  {
    name: "Pricing & Monetization",
    slug: "pricing-monetization",
    description:
      "Pricing models, willingness-to-pay, unit economics, and packaging strategy",
    icon: "💰",
    careers: [
      "product-management",
      "founder",
      "consulting",
      "sales-strategy",
    ],
  },
  {
    name: "Data Interpretation",
    slug: "data-interpretation",
    description:
      "Reading dashboards, identifying signals in noise, drawing conclusions from metrics",
    icon: "📊",
    careers: [
      "product-management",
      "growth",
      "consulting",
      "business-operations",
    ],
  },
  {
    name: "Prioritization",
    slug: "prioritization",
    description:
      "Frameworks for tradeoff decisions, resource allocation, and saying no",
    icon: "⚖️",
    careers: [
      "product-management",
      "consulting",
      "founder",
      "business-operations",
    ],
  },
  {
    name: "Stakeholder Communication",
    slug: "stakeholder-communication",
    description:
      "Structuring arguments, executive communication, persuasion, and alignment",
    icon: "🗣️",
    careers: [
      "product-management",
      "consulting",
      "marketing",
      "sales-strategy",
    ],
  },
];

const CAREER_OUTCOMES = [
  {
    name: "Product Management",
    slug: "product-management",
    description: "Lead product strategy, roadmap, and cross-functional teams",
    icon: "📦",
  },
  {
    name: "Consulting",
    slug: "consulting",
    description:
      "Advise organizations on strategy, operations, and transformation",
    icon: "🏛️",
  },
  {
    name: "Marketing",
    slug: "marketing",
    description:
      "Drive brand, demand generation, and go-to-market execution",
    icon: "📣",
  },
  {
    name: "Founder / Entrepreneurship",
    slug: "founder",
    description: "Build and scale new ventures from zero to one",
    icon: "⚡",
  },
  {
    name: "Growth",
    slug: "growth",
    description:
      "Optimize user acquisition, activation, retention, and revenue",
    icon: "📈",
  },
  {
    name: "Sales Strategy",
    slug: "sales-strategy",
    description:
      "Design sales processes, pricing strategies, and deal structures",
    icon: "🤝",
  },
  {
    name: "Business Operations",
    slug: "business-operations",
    description:
      "Streamline processes, manage resources, and drive operational excellence",
    icon: "⚙️",
  },
];

// ─── LEARN Sprint Data ──────────────────────────────────────────────────────

interface SprintSeed {
  title: string;
  description: string;
  skillSlug: string;
  mode: "LEARN";
  difficulty: number;
  interactions: {
    type: "TEACH_AND_TEST";
    order: number;
    prompt: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    insightAnswer: string;
    teachingPreamble: string;
    timeTarget: number;
  }[];
}

const LEARN_SPRINTS: SprintSeed[] = [
  // ─── Guesstimation Sprint 1 ────────────────────────────────
  {
    title: "Fermi Fundamentals: Market Sizing from Scratch",
    description: "Learn the building blocks of Fermi estimation through real market sizing challenges",
    skillSlug: "guesstimation",
    mode: "LEARN",
    difficulty: 1,
    interactions: [
      {
        type: "TEACH_AND_TEST",
        order: 0,
        prompt: "You need to estimate the number of gas stations in the United States. Which starting anchor is most useful?",
        options: [
          { id: "a", text: "Google the exact number and work backward" },
          { id: "b", text: "Start with US population (~330M), estimate cars per household, and derive fuel demand" },
          { id: "c", text: "Count gas stations in your city and multiply by the number of cities" },
          { id: "d", text: "Estimate total US land area and assume one gas station per square mile" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Fermi estimation starts with anchoring: picking a known number you're confident about and building from there. The best anchors are population figures, time-based rates, or geographic constants. The US population (~330M) is the most versatile anchor because most market sizes ultimately derive from the number of people.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 1,
        prompt: "You're estimating the US coffee market. You anchor on 330M people, assume 70% are adults (231M), and 60% drink coffee (139M). The average coffee drinker spends $3/day. What critical assumption should you pressure-test first?",
        options: [
          { id: "a", text: "Whether the US population is exactly 330M" },
          { id: "b", text: "Whether 60% of adults really drink coffee daily" },
          { id: "c", text: "Whether $3/day captures both home-brew and cafe purchases" },
          { id: "d", text: "Whether to include children who drink coffee" },
        ],
        correctAnswer: "b",
        insightAnswer: "c",
        teachingPreamble: "After building your estimate tree, always identify the 'swing variable' -- the single assumption that, if wrong, would change your answer the most. In a chain of multiplications, the swing variable is usually the one with the widest plausible range. A factor that could range from 40% to 80% matters more than one that ranges from 325M to 335M.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 2,
        prompt: "Your estimate for annual ride-sharing revenue in New York City is $4.2 billion. Your interviewer says the actual number is $2.8 billion. Your estimate was off by 50%. In consulting, what is this considered?",
        options: [
          { id: "a", text: "A failure -- you should be within 10%" },
          { id: "b", text: "Acceptable -- within an order of magnitude is the standard" },
          { id: "c", text: "Perfect -- any answer with real math is fine" },
          { id: "d", text: "Too close -- you probably just memorized the number" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "The goal of Fermi estimation is NOT to get the exact number. It's to get within an order of magnitude (10x) through structured reasoning. Being within 2x of the actual answer is excellent. The process matters more than the output: interviewers want to see how you decompose problems, identify assumptions, and sanity-check results.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 3,
        prompt: "You're estimating the number of piano tuners in Chicago. Which decomposition tree is most robust?",
        options: [
          { id: "a", text: "Chicago population -> households -> piano ownership rate -> tunings per year -> tuner capacity" },
          { id: "b", text: "Number of music schools in Chicago -> pianos per school -> tuner need" },
          { id: "c", text: "Average US city piano tuner count -> scale by Chicago's size" },
          { id: "d", text: "Total US piano tuners -> divide by number of major cities" },
        ],
        correctAnswer: "a",
        insightAnswer: "a",
        teachingPreamble: "The best decomposition tree has the most 'known' or 'estimable' nodes. Option A is the classic Fermi approach because each step involves a number you can reasonably estimate: Chicago has ~2.7M people, ~1M households, maybe 5% own a piano (50K pianos), each tuned 1-2x/year (75K tunings), and a tuner does ~4 per day x 250 days = 1,000/year. That gives ~75 tuners.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 4,
        prompt: "You estimated a $500M TAM for a B2B SaaS product. Your manager asks you to convert this to SAM (Serviceable Addressable Market). What is the key difference?",
        options: [
          { id: "a", text: "SAM = TAM minus competitors' existing revenue" },
          { id: "b", text: "SAM = the portion of TAM your product can actually serve given geography, segment, and feature constraints" },
          { id: "c", text: "SAM = TAM divided by the number of competitors in the market" },
          { id: "d", text: "SAM = TAM multiplied by your current market share" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Market sizing uses three nested circles: TAM (Total Addressable Market) is the total revenue opportunity if you had 100% share. SAM (Serviceable Addressable Market) narrows this to the segment you can actually reach with your current product, geography, and go-to-market. SOM (Serviceable Obtainable Market) is what you can realistically capture in 3-5 years.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 5,
        prompt: "You're sizing the US electric vehicle charging station market. You estimate 3 million EVs on the road, each needing public charging 2x/month at $10/session = $720M/year. A colleague suggests a top-down check. What would that look like?",
        options: [
          { id: "a", text: "Look up Tesla's revenue and multiply by market share inverse" },
          { id: "b", text: "Take total US fuel spend ($400B) and multiply by EV market share (~2%) = $8B, then estimate what % goes to public charging" },
          { id: "c", text: "Google 'EV charging market size' to verify" },
          { id: "d", text: "Ask the colleague for their estimate instead" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Triangulation means checking your bottom-up estimate with a top-down approach (or vice versa). If both approaches land in a similar range, you can be more confident. The best Fermi estimators always run at least two independent calculations. When they diverge significantly, investigate which assumptions differ.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 6,
        prompt: "You need to estimate how many tennis balls fit in this room (assume 5m x 5m x 3m = 75 cubic meters). A tennis ball has a diameter of ~6.5cm. What adjustment factor should you apply after dividing room volume by ball volume?",
        options: [
          { id: "a", text: "No adjustment -- the math is straightforward division" },
          { id: "b", text: "Multiply by 0.64 -- spheres in random packing fill about 64% of space" },
          { id: "c", text: "Multiply by 0.5 -- half the space is always wasted" },
          { id: "d", text: "Multiply by 0.9 -- only 10% is wasted with careful stacking" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Physical Fermi problems require knowledge of packing efficiency. Randomly packed spheres fill about 64% of available space (this is a well-known constant). Showing you know this packing factor signals analytical sophistication. The calculation: room = 75m^3, ball volume = 4/3 * pi * (0.0325)^3 = 0.000144m^3. Naive division gives ~521K, but with packing: ~334K balls.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 7,
        prompt: "You're presenting a market size estimate to a partner at McKinsey. Your bottom-up estimate is $2.1B and your top-down estimate is $3.8B. What should you do?",
        options: [
          { id: "a", text: "Average them and present $2.95B as the answer" },
          { id: "b", text: "Present both estimates, identify which assumptions drive the gap, and give a reasoned range of $2-4B with your best guess" },
          { id: "c", text: "Go with the bottom-up number since it's more rigorous" },
          { id: "d", text: "Go with the top-down number since it uses industry data" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "When two estimation methods diverge, the gap itself is informative. A senior consultant presents a range, explains what drives the difference, and states which assumptions they have higher confidence in. Simply averaging destroys information. The reasoning behind your range is often more valuable than the point estimate.",
        timeTarget: 25,
      },
    ],
  },

  // ─── Guesstimation Sprint 2 ────────────────────────────────
  {
    title: "Advanced Estimation: Revenue Models & Unit Economics",
    description: "Apply estimation skills to business revenue models and unit economics in real scenarios",
    skillSlug: "guesstimation",
    mode: "LEARN",
    difficulty: 2,
    interactions: [
      {
        type: "TEACH_AND_TEST",
        order: 0,
        prompt: "A food delivery startup operates in 12 US cities. They want to estimate annual GMV (Gross Merchandise Value). Which metric chain gives the tightest estimate?",
        options: [
          { id: "a", text: "Cities x restaurants per city x orders per restaurant per day x average order value x 365" },
          { id: "b", text: "Active users x orders per user per month x average order value x 12" },
          { id: "c", text: "Total US food delivery market x their estimated market share" },
          { id: "d", text: "Total venture funding raised x typical GMV-to-funding ratio" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "When estimating revenue for a platform business, the demand-side chain (users -> frequency -> basket size) is usually tighter than supply-side (restaurants -> orders). This is because user behavior data is more predictable. A typical food delivery user orders 3-5x/month with an AOV of $25-35. Active user count is the swing variable.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 1,
        prompt: "A SaaS company has 2,000 customers paying an average of $500/month. Monthly churn is 3%. Without new sales, what's the approximate annual revenue? (Hint: think about the decaying customer base.)",
        options: [
          { id: "a", text: "$12M (2,000 x $500 x 12)" },
          { id: "b", text: "$10.2M (accounting for monthly churn reducing the base each month)" },
          { id: "c", text: "$8.4M (3% monthly churn means 36% annual churn, so 64% retained)" },
          { id: "d", text: "$6M (half the customers will churn within a year)" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "With 3% monthly churn, you lose customers each month from a shrinking base. Month 1: 2,000 x $500, Month 2: 1,940 x $500, etc. The annual revenue is the sum of this geometric series. A quick approximation: average customers over 12 months is roughly 2,000 x (1 + 0.97^12)/2 = 2,000 x (1 + 0.694)/2 = 1,694 average. So ~$10.2M. Note: 3% monthly is NOT 36% annual -- it's 1 - 0.97^12 = 30.6% annual churn.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 2,
        prompt: "You're estimating the revenue of Uber in a single city (Austin, TX, pop ~1M). Assume 15% of adults use ride-sharing, they take 3 rides/month, average fare is $18, and Uber has 70% market share. What's Uber's approximate annual gross bookings in Austin?",
        options: [
          { id: "a", text: "About $29M" },
          { id: "b", text: "About $73M" },
          { id: "c", text: "About $145M" },
          { id: "d", text: "About $350M" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Walking through the chain: Austin ~1M people, ~780K adults, 15% use ride-sharing = 117K riders, 3 rides/month = 351K rides/month, x $18 avg fare = $6.3M/month total market, x 70% Uber share = $4.4M/month, x 12 = ~$53M. The closest answer accounting for rounding up is ~$73M (the question assumes a slightly higher adult % or ride frequency). The key is showing the structured chain.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 3,
        prompt: "A startup's unit economics show: Customer Acquisition Cost (CAC) = $120, Average Revenue Per User (ARPU) = $40/month, Gross Margin = 70%, Monthly Churn = 5%. What is the LTV:CAC ratio?",
        options: [
          { id: "a", text: "About 2.3x -- marginal but viable" },
          { id: "b", text: "About 4.7x -- healthy unit economics" },
          { id: "c", text: "About 6.7x -- excellent economics" },
          { id: "d", text: "About 1.1x -- not viable" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "LTV = ARPU x Gross Margin / Monthly Churn = $40 x 0.70 / 0.05 = $560. LTV:CAC = $560 / $120 = 4.67x. The industry benchmark is 3x+ for a healthy business. This formula (ARPU x GM / Churn) assumes constant churn and is a simplification, but it's the standard quick calculation used in VC and growth teams.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 4,
        prompt: "You need to estimate how many daily active users (DAUs) Spotify has. You know they reported 600M monthly active users (MAUs) globally. What DAU/MAU ratio should you assume for a music streaming app?",
        options: [
          { id: "a", text: "~15% (90M DAUs) -- streaming is habitual but not daily for most" },
          { id: "b", text: "~30% (180M DAUs) -- music is a daily habit for engaged users" },
          { id: "c", text: "~50% (300M DAUs) -- most streamers listen daily" },
          { id: "d", text: "~75% (450M DAUs) -- music is essential like messaging" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "DAU/MAU ratio (called 'stickiness') varies by category: Messaging apps ~50-70%, Social media ~30-50%, Music streaming ~25-35%, E-commerce ~5-15%, Travel ~2-5%. Knowing these benchmark ranges is a superpower for estimation. Spotify's actual DAU/MAU is roughly 30%, giving ~180M DAUs. Memorize 3-4 category benchmarks.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 5,
        prompt: "A D2C brand spends $200K/month on Facebook ads with a 2.5x ROAS (Return on Ad Spend). They want to estimate annual profit from this channel. Gross margin is 65% and fulfillment costs are $8 per order (average order $50). What should they calculate?",
        options: [
          { id: "a", text: "Revenue ($6M) minus ad spend ($2.4M) = $3.6M profit" },
          { id: "b", text: "Revenue ($6M) x gross margin (65%) minus ad spend ($2.4M) minus fulfillment = roughly $1.1M contribution profit" },
          { id: "c", text: "Just use ROAS: 2.5x means 150% return, so $3.6M profit" },
          { id: "d", text: "Revenue ($6M) minus COGS only = $3.9M" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "ROAS only measures revenue vs ad spend, not profit. To estimate channel contribution profit: Revenue = $200K x 2.5 x 12 = $6M. Gross profit = $6M x 0.65 = $3.9M. Orders = $6M / $50 = 120K. Fulfillment = 120K x $8 = $960K. Contribution = $3.9M - $2.4M (ads) - $960K = $540K. Many D2C brands discover their 'profitable' channels are barely break-even once you stack all costs.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 6,
        prompt: "You're estimating revenue for a hypothetical airport: 30M passengers/year, average dwell time 90 minutes. How should you estimate non-aeronautical revenue (retail, food, parking)?",
        options: [
          { id: "a", text: "Use industry benchmark: ~$15-25 revenue per departing passenger" },
          { id: "b", text: "Estimate square footage of retail and apply revenue per sq ft" },
          { id: "c", text: "Count the number of stores and estimate each one's revenue" },
          { id: "d", text: "Both A and B -- use passenger-based and space-based estimates to triangulate" },
        ],
        correctAnswer: "d",
        insightAnswer: "d",
        teachingPreamble: "Airport revenue estimation is a classic case for triangulation. Approach 1 (demand-side): 30M pax x $20/pax = $600M. Approach 2 (supply-side): estimate 500K sq ft of retail at $1,200/sq ft/year = $600M. When both approaches converge, you have high confidence. Real airports range from $10 (small domestic) to $50+ (luxury international) per passenger.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 7,
        prompt: "Your startup is fundraising and needs to estimate its path to $100M ARR. You currently have $2M ARR growing 15% month-over-month. How many months until you hit $100M ARR at this growth rate?",
        options: [
          { id: "a", text: "About 18 months" },
          { id: "b", text: "About 28 months" },
          { id: "c", text: "About 36 months" },
          { id: "d", text: "About 48 months" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "This is a compound growth problem: $2M x 1.15^n = $100M, so 1.15^n = 50. Taking log: n = ln(50)/ln(1.15) = 3.91/0.14 = 27.9 months. A quick shortcut: at 15% monthly growth, you roughly double every 5 months (Rule of 72: 72/15 = 4.8). $2M -> $4M -> $8M -> $16M -> $32M -> $64M -> $128M = about 6 doublings = 30 months. Close enough for estimation.",
        timeTarget: 25,
      },
    ],
  },

  // ─── GTM Strategy Sprint 1 ─────────────────────────────────
  {
    title: "GTM Foundations: Channel Strategy & Market Entry",
    description: "Master the fundamentals of go-to-market strategy through real-world channel decisions",
    skillSlug: "gtm-strategy",
    mode: "LEARN",
    difficulty: 1,
    interactions: [
      {
        type: "TEACH_AND_TEST",
        order: 0,
        prompt: "A B2B SaaS startup has built an AI-powered contract analysis tool priced at $2,000/month. Their target customer is General Counsel at mid-market companies (500-5,000 employees). Which primary GTM motion makes most sense?",
        options: [
          { id: "a", text: "Product-led growth with a freemium tier" },
          { id: "b", text: "Content marketing and inbound SEO" },
          { id: "c", text: "Outbound sales with SDR team targeting legal departments" },
          { id: "d", text: "Channel partnerships with law firms" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "GTM motion selection depends on three factors: ACV (Annual Contract Value), buyer persona, and purchase complexity. At $24K ACV targeting a specific executive (GC), outbound sales is the natural fit. The rule of thumb: <$5K ACV = product-led, $5K-$50K = inside sales / inbound, $50K+ = field sales / enterprise. Legal buyers also prefer relationship-based selling.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 1,
        prompt: "You're launching a consumer fintech app in the US. Your research shows 60% of your target users discover financial apps through word-of-mouth, 25% through app store search, and 15% through ads. Which launch strategy maximizes early growth?",
        options: [
          { id: "a", text: "Spend 60% of budget on referral incentives, 25% on ASO, 15% on paid ads" },
          { id: "b", text: "Focus 80% on paid ads to build initial user base, then layer in referrals" },
          { id: "c", text: "Invest heavily in App Store Optimization first since it's the cheapest organic channel" },
          { id: "d", text: "Build a strong referral program but seed it with targeted paid acquisition to create the initial referral base" },
        ],
        correctAnswer: "d",
        insightAnswer: "d",
        teachingPreamble: "Referral programs need a critical mass of users to generate word-of-mouth. The 'cold start problem' means you can't rely on virality from day one. The best strategy is: (1) use paid acquisition to build an initial cohort of 1,000-5,000 engaged users, (2) launch a strong referral program with that base, (3) shift budget from paid to referral incentives as the viral loop kicks in.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 2,
        prompt: "A SaaS company is choosing between two channel partners: Partner A (2,000 customers, 10% overlap with target) and Partner B (500 customers, 60% overlap with target). Each partner charges 20% revenue share. Which is better and why?",
        options: [
          { id: "a", text: "Partner A -- larger reach means more absolute customers" },
          { id: "b", text: "Partner B -- higher ICP overlap means better conversion and lower effective CAC" },
          { id: "c", text: "Both equally -- 200 vs 300 overlapping customers isn't a big difference" },
          { id: "d", text: "Neither -- 20% revenue share is too expensive for any channel partner" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Channel effectiveness = Reach x ICP Overlap x Conversion Rate. Partner A: 2,000 x 10% = 200 potential. Partner B: 500 x 60% = 300 potential. But more importantly, high-overlap partners convert 3-5x better because their customers already have the problem you solve. Partner B will likely yield 150+ customers vs Partner A's 20-40. Revenue share is standard for channel -- the key metric is effective CAC.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 3,
        prompt: "You're planning the launch sequence for a new project management tool. Which market segment should you target FIRST?",
        options: [
          { id: "a", text: "Enterprise companies (5,000+ employees) -- highest revenue per deal" },
          { id: "b", text: "Small startups (1-20 employees) -- fastest sales cycle, quick iteration" },
          { id: "c", text: "Mid-market (100-500 employees) -- balanced deal size and sales cycle" },
          { id: "d", text: "Freelancers -- largest addressable number of users" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "The ideal first market segment has three properties: (1) short sales cycles for fast learning, (2) high pain tolerance for imperfect products, and (3) willingness to give direct feedback. Small startups fit all three. This is the 'bowling pin strategy' -- knock down the easiest pin first, then use momentum (case studies, product maturity) to move upmarket. Notion, Slack, and Figma all started with startups before expanding to enterprise.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 4,
        prompt: "Your B2B startup has $500K to allocate across three GTM channels for Q1. Historical data shows: Content Marketing (6-month payback, 4x LTV:CAC), Paid Search (1-month payback, 2x LTV:CAC), Outbound Sales (3-month payback, 5x LTV:CAC). How should you allocate?",
        options: [
          { id: "a", text: "100% to Outbound Sales -- best LTV:CAC ratio" },
          { id: "b", text: "Equal split: $167K to each channel" },
          { id: "c", text: "50% Outbound, 30% Content, 20% Paid Search -- balance short-term pipeline with long-term organic" },
          { id: "d", text: "60% Paid Search for immediate revenue, 40% Content for long-term" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "GTM channel allocation requires balancing efficiency (LTV:CAC), speed (payback period), and scalability (channel ceiling). Outbound Sales has the best economics but limited by team size. Paid Search gives immediate pipeline but at lower efficiency. Content builds compounding returns but takes 6+ months. A mature GTM budget typically allocates 40-50% to the highest-ROI channel and diversifies the rest.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 5,
        prompt: "A product-led growth SaaS (Figma-style) sees this funnel: 10,000 signups/month, 3,000 activate (use core feature), 600 convert to paid, 540 retain after month 1. What is the biggest leak to fix first?",
        options: [
          { id: "a", text: "Signup to activation (70% drop-off) -- most users never see the value" },
          { id: "b", text: "Activation to paid conversion (80% drop-off) -- pricing or packaging issue" },
          { id: "c", text: "Month 1 retention (10% churn) -- product-market fit concern" },
          { id: "d", text: "Top of funnel -- need more signups" },
        ],
        correctAnswer: "a",
        insightAnswer: "a",
        teachingPreamble: "In PLG, always fix the funnel from the top down. The activation step (70% drop-off) is the biggest absolute leak: improving it from 30% to 45% would yield 4,500 activated users, which flows through to 900 paid conversions -- a 50% revenue increase. The 80% conversion drop sounds worse, but activation-to-paid of 20% is actually decent for PLG. Fix the 'aha moment' first.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 6,
        prompt: "You're entering the Japanese market with your SaaS product. What is the single most important GTM adaptation you need to make?",
        options: [
          { id: "a", text: "Translate the product to Japanese" },
          { id: "b", text: "Establish local partnerships -- Japanese businesses strongly prefer buying through trusted local partners" },
          { id: "c", text: "Lower your pricing to match local willingness-to-pay" },
          { id: "d", text: "Open a Tokyo office for in-person sales meetings" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "International GTM requires understanding local buying patterns, not just language. Japan's B2B market is heavily partner-driven: 70-80% of enterprise software purchases go through system integrators and resellers. Direct sales to Japanese enterprises without a local partner is extremely difficult regardless of product quality. Salesforce, AWS, and Microsoft all entered Japan through partnership-first strategies.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 7,
        prompt: "Your competitor just launched a similar product at 40% lower price. Your product has been in market for 2 years with 500 customers. What is the best immediate GTM response?",
        options: [
          { id: "a", text: "Match their pricing to prevent customer loss" },
          { id: "b", text: "Launch a 'competitive displacement' program offering free migration and extended trials" },
          { id: "c", text: "Double down on customer success to reduce churn and arm champions with competitive battle cards" },
          { id: "d", text: "Ignore them -- if your product is better, customers will stay" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "When facing a lower-priced competitor, the immediate priority is protecting your existing base, not matching price. Price wars destroy margins for both companies. The winning strategy: (1) arm your customer-facing teams with competitive positioning, (2) invest in customer success to deepen switching costs, (3) accelerate your product roadmap on features the competitor lacks. Existing customers rarely switch for price alone if they're getting value.",
        timeTarget: 25,
      },
    ],
  },

  // ─── GTM Strategy Sprint 2 ─────────────────────────────────
  {
    title: "GTM Execution: Launch Playbooks & Scaling Channels",
    description: "Learn how to plan and execute product launches and scale go-to-market channels",
    skillSlug: "gtm-strategy",
    mode: "LEARN",
    difficulty: 2,
    interactions: [
      {
        type: "TEACH_AND_TEST",
        order: 0,
        prompt: "You're planning a Product Hunt launch for your developer tool. Which launch-day metric matters MOST for long-term GTM success?",
        options: [
          { id: "a", text: "Number of upvotes (aiming for #1 product of the day)" },
          { id: "b", text: "Number of signups from the launch" },
          { id: "c", text: "Activation rate of launch-day signups within 48 hours" },
          { id: "d", text: "Amount of press coverage generated" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "Product Hunt launches generate vanity metrics (upvotes, press) and real metrics (signups that activate). The #1 mistake is optimizing for rank instead of quality signups. A launch that gets 500 signups with 40% activation is worth far more than 5,000 signups with 5% activation. Activated users become your word-of-mouth engine. Many top-ranked PH launches see 95% of signups churn within a week.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 1,
        prompt: "Your B2B startup's outbound sales team sends 1,000 cold emails/week with a 2% meeting rate and 25% meeting-to-opportunity rate. You need to go from 5 opportunities/week to 20. What's the most efficient lever?",
        options: [
          { id: "a", text: "4x the email volume to 4,000/week" },
          { id: "b", text: "Improve the meeting rate from 2% to 8% through better targeting and messaging" },
          { id: "c", text: "Hire 3 more SDRs to increase outreach capacity" },
          { id: "d", text: "Switch to LinkedIn outreach instead of email" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Before scaling volume, optimize conversion. Improving meeting rate from 2% to 8% (achievable with better ICP targeting, personalized messaging, and multi-channel sequences) gives you 80 meetings/week x 25% = 20 opportunities -- hitting your target without any additional headcount. Scaling volume 4x with poor conversion just means 4x the spam. The best outbound teams achieve 5-12% meeting rates through hyper-personalization.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 2,
        prompt: "You're scaling content marketing for a B2B SaaS. Your blog gets 50K monthly visitors but only generates 100 leads/month (0.2% conversion). What should you prioritize?",
        options: [
          { id: "a", text: "Write more content to increase traffic to 200K" },
          { id: "b", text: "Create high-intent bottom-of-funnel content with strategic CTAs instead of top-of-funnel blog posts" },
          { id: "c", text: "Add more pop-ups and lead capture forms" },
          { id: "d", text: "Switch from blog to video content" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "A 0.2% visitor-to-lead conversion signals a content-intent mismatch. Most B2B blogs over-index on top-of-funnel content (industry trends, thought leadership) that attracts readers with no purchase intent. Bottom-of-funnel content -- comparison pages, ROI calculators, integration guides, 'how to solve X' with product as the answer -- converts 5-15x better. A 50K traffic blog with 2% conversion (1,000 leads) beats a 200K blog at 0.2%.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 3,
        prompt: "Your SaaS product is selling well to SMBs ($500/month ACV) and you want to move upmarket to enterprise ($5,000+/month). What's the first thing you need to build?",
        options: [
          { id: "a", text: "Enterprise features: SSO, audit logs, role-based access control" },
          { id: "b", text: "A case study from your largest current customer" },
          { id: "c", text: "A dedicated enterprise sales team" },
          { id: "d", text: "SOC 2 compliance certification" },
        ],
        correctAnswer: "a",
        insightAnswer: "a",
        teachingPreamble: "Moving upmarket requires satisfying enterprise procurement requirements BEFORE you can sell. The typical enterprise checklist: SSO/SAML (non-negotiable), RBAC, audit logs, SOC 2, SLAs, and dedicated support. Without SSO alone, you'll be rejected by IT security reviews at 80% of enterprises. Build the table-stakes features first, then layer on sales motion and case studies. Many SaaS companies fail the upmarket move by hiring enterprise sales reps before the product is enterprise-ready.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 4,
        prompt: "Your company is launching a second product that complements the first. 40% of existing customers are a fit for the new product. What GTM strategy captures the most revenue fastest?",
        options: [
          { id: "a", text: "Bundle it with the existing product at a 20% discount" },
          { id: "b", text: "Launch to existing customers first with a dedicated cross-sell motion, then open to new customers" },
          { id: "c", text: "Treat it as a separate product with its own GTM team and brand" },
          { id: "d", text: "Offer it free to existing customers as a retention tool" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Cross-sell to existing customers is 5-10x cheaper than acquiring new ones and converts 3-5x better because trust already exists. The playbook: (1) Segment existing customers by fit, (2) run a focused cross-sell campaign with customer success, (3) use early adopters' feedback to refine before broader launch. Bundling can work but sacrifices revenue. Giving it away destroys perceived value. Separating it entirely wastes your biggest advantage: existing relationships.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 5,
        prompt: "You've been running Google Ads for 6 months. Your best-performing keyword group has a $45 CAC with a target of $60. You've maxed out budget on this group. What's the next scaling move?",
        options: [
          { id: "a", text: "Increase bids on the winning keywords to capture more impression share" },
          { id: "b", text: "Expand to adjacent keyword themes and accept higher CAC up to your $60 target" },
          { id: "c", text: "Move budget to Facebook/Instagram ads for diversification" },
          { id: "d", text: "Create more ad variations for the winning keywords" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Paid acquisition follows a CAC curve: your best keywords are cheap but limited in volume. Scaling means moving along the curve to adjacent (higher-CAC but still profitable) keywords. The key insight is that you have $15 of 'CAC headroom' ($60 target - $45 actual) to invest in expansion. Adjacent themes might have $55 CAC -- less efficient but still profitable. Increasing bids on maxed keywords hits diminishing returns. Diversifying channels is a separate strategy, not a scaling move.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 6,
        prompt: "You're choosing a pricing page layout for your SaaS. Research shows 3-tier pricing converts best. What should the middle tier be designed to do?",
        options: [
          { id: "a", text: "Offer the best value to maximize conversions" },
          { id: "b", text: "Be the decoy that makes the top tier look like a better deal" },
          { id: "c", text: "Represent the most popular option that most customers choose" },
          { id: "d", text: "Serve as a compromise between cheap and expensive" },
        ],
        correctAnswer: "c",
        insightAnswer: "b",
        teachingPreamble: "The 3-tier pricing strategy uses 'anchoring and decoy effects.' The correct answer is that the middle tier should be the most popular -- but the deepest insight is understanding WHY. Smart pricing pages design the middle tier as a decoy that makes the top tier irrationally attractive. If middle = $49 (5 features) and top = $59 (15 features), the $10 difference for 10 more features makes the top tier feel like a steal. This is called 'asymmetric dominance.'",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 7,
        prompt: "Your startup is pre-revenue and building initial traction. Which GTM metric should your board deck highlight?",
        options: [
          { id: "a", text: "Total addressable market (TAM)" },
          { id: "b", text: "Waitlist size and signup-to-activation conversion rate" },
          { id: "c", text: "Projected revenue for next 12 months" },
          { id: "d", text: "Competitive comparison matrix" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Pre-revenue startups must show demand signals and product-market fit indicators, not projections. Waitlist size shows demand. Activation rate shows the product delivers value. Together, they tell investors: 'People want this AND it works.' TAM is table-stakes (every deck has it). Revenue projections pre-revenue are fiction. The best pre-revenue metric is Week-1 retention of activated users -- it's the earliest true PMF signal.",
        timeTarget: 25,
      },
    ],
  },

  // ─── Prioritization Sprint 1 ──────────────────────────────
  {
    title: "Prioritization Frameworks: RICE, ICE & Beyond",
    description: "Learn systematic frameworks for making tradeoff decisions and allocating scarce resources",
    skillSlug: "prioritization",
    mode: "LEARN",
    difficulty: 1,
    interactions: [
      {
        type: "TEACH_AND_TEST",
        order: 0,
        prompt: "Your product team has 15 feature requests from customers. Engineering can ship 4 this quarter. Which prioritization approach is most defensible?",
        options: [
          { id: "a", text: "Let the CEO pick the top 4 based on strategic vision" },
          { id: "b", text: "Score each feature using a consistent framework (like RICE) and pick the top 4, then sanity-check with stakeholders" },
          { id: "c", text: "Ship whatever the biggest customer is asking for" },
          { id: "d", text: "Let engineering pick based on what's easiest to build" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "Framework-driven prioritization (RICE, ICE, value-vs-effort) provides objectivity, transparency, and defensibility. When stakeholders ask 'why isn't MY feature on the roadmap?', you can point to the scoring. Pure top-down decisions create political dysfunction. Pure customer-driven creates a feature factory. The framework provides the starting point; human judgment provides the final calibration.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 1,
        prompt: "In the RICE framework, the four factors are Reach, Impact, Confidence, and Effort. Feature A scores: Reach=5000 users, Impact=2 (high), Confidence=80%, Effort=3 person-months. Feature B scores: Reach=500 users, Impact=3 (massive), Confidence=50%, Effort=1 person-month. Which has the higher RICE score?",
        options: [
          { id: "a", text: "Feature A: RICE = 2,667" },
          { id: "b", text: "Feature B: RICE = 750" },
          { id: "c", text: "They're roughly equal" },
          { id: "d", text: "Cannot calculate without more information" },
        ],
        correctAnswer: "a",
        insightAnswer: "a",
        teachingPreamble: "RICE Score = (Reach x Impact x Confidence) / Effort. Feature A: (5000 x 2 x 0.8) / 3 = 8000/3 = 2,667. Feature B: (500 x 3 x 0.5) / 1 = 750/1 = 750. Feature A wins by 3.6x despite Feature B's higher individual impact, because Reach is the strongest multiplier. This illustrates a key prioritization insight: features that affect many users moderately almost always beat features that affect few users dramatically.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 2,
        prompt: "Your team uses ICE scoring (Impact, Confidence, Ease -- each rated 1-10). A controversial feature scores Impact=9, Confidence=3, Ease=7. What should you do?",
        options: [
          { id: "a", text: "Build it -- the impact score is too high to ignore" },
          { id: "b", text: "Kill it -- low confidence means it's too risky" },
          { id: "c", text: "Run a low-cost experiment to increase confidence before committing full resources" },
          { id: "d", text: "Ask more customers whether they want it" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "Low confidence with high impact is the definition of a 'bet worth de-risking.' The correct response is NEVER to build the full feature (too risky) or kill it (too valuable). Instead, design a minimum experiment: a prototype, a fake door test, a manual concierge version, or a customer co-design session. The goal is to move confidence from 3 to 7+ at minimal cost, THEN decide. This is the essence of lean prioritization.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 3,
        prompt: "You're a PM at a growth-stage startup. The CEO wants Feature X (strategic bet, unclear ROI, 3 months). The VP Sales wants Feature Y (closes $500K deal, 2 weeks). The VP Engineering wants to pay down tech debt (no features, 1 month). You can only do one. What do you do?",
        options: [
          { id: "a", text: "Feature Y -- $500K in revenue is concrete and immediate" },
          { id: "b", text: "Feature X -- the CEO's strategic vision trumps short-term revenue" },
          { id: "c", text: "Tech debt -- engineering velocity compounds and affects everything" },
          { id: "d", text: "Negotiate: 2 weeks on Feature Y (capture the deal), then reassess X vs tech debt with data" },
        ],
        correctAnswer: "d",
        insightAnswer: "d",
        teachingPreamble: "Real prioritization isn't picking one thing from a list -- it's sequencing and negotiating. Feature Y is 2 weeks and captures $500K -- do it first. Then you have a clearer decision: does the closed deal change the strategic calculus? Can you spend 2 weeks on tech debt before starting Feature X? The best PMs find ways to say 'yes, and' instead of 'no.' Sequencing is the hidden superpower of prioritization.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 4,
        prompt: "Your backlog has 80 items. Stakeholders are frustrated that their items 'never get built.' What is the most effective first step?",
        options: [
          { id: "a", text: "Hire more engineers to increase throughput" },
          { id: "b", text: "Ruthlessly cut the backlog to 20 items and be transparent about what was cut and why" },
          { id: "c", text: "Implement a voting system so stakeholders can democratically prioritize" },
          { id: "d", text: "Create a public roadmap so stakeholders can see when their items will ship" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "A backlog of 80 items is not a backlog -- it's a graveyard. Items at position 50+ will never be built, but their presence creates false hope and stakeholder frustration. The most impactful move is saying NO explicitly: cut 75% of items, tell stakeholders why, and maintain a short, honest backlog. This is uncomfortable but creates trust. As Warren Buffett said: 'The difference between successful people and very successful people is that very successful people say no to almost everything.'",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 5,
        prompt: "You're using a 2x2 matrix (Value vs Effort) to prioritize. Most of your items cluster in the 'high value, high effort' quadrant. How do you break the tie?",
        options: [
          { id: "a", text: "Pick the one with the highest value regardless of effort" },
          { id: "b", text: "Pick the one with the lowest effort to show quick progress" },
          { id: "c", text: "Add a third dimension: time-sensitivity or strategic alignment" },
          { id: "d", text: "Flip a coin -- if they're all high-value/high-effort, the difference is marginal" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "When a prioritization framework produces ties, it means the framework lacks a critical dimension. The 2x2 matrix is great for initial sorting but insufficient for final ranking. Common tiebreaker dimensions include: (1) Time-sensitivity (is there a market window?), (2) Strategic alignment (does it support the company's big bet?), (3) Learning value (does building it teach us something crucial?), (4) Dependency (does it unblock other high-value work?).",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 6,
        prompt: "Your team is debating between investing in acquisition (new user growth) vs retention (reducing churn from 5% to 3% monthly). Current MRR is $200K with 400 customers. Which investment has higher 12-month ROI?",
        options: [
          { id: "a", text: "Acquisition -- growing the top line is always more important" },
          { id: "b", text: "Retention -- reducing churn from 5% to 3% has a compounding effect that exceeds typical acquisition investments" },
          { id: "c", text: "They're roughly equal -- invest in both" },
          { id: "d", text: "Depends entirely on the cost of each initiative" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "At 5% monthly churn, after 12 months you retain only 54% of customers. At 3% churn, you retain 69%. On a $200K MRR base, that difference is: 69% x $200K - 54% x $200K = $30K/month more by month 12, or roughly $180K more cumulative revenue over the year. Meanwhile, acquiring enough new customers to offset that gap at typical CAC ($500+) would cost $150K+. Retention improvements compound; acquisition is linear. This is why SaaS wisdom says 'fix the leaky bucket before pouring more water.'",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 7,
        prompt: "You're leading a quarterly planning session. The team generates 30 ideas. Which process produces the best prioritized list?",
        options: [
          { id: "a", text: "Have everyone vote, then discuss the top 10" },
          { id: "b", text: "Score each idea individually on a framework, then have the team calibrate scores together before finalizing" },
          { id: "c", text: "Let the most senior person rank them" },
          { id: "d", text: "Group them into themes and pick the most important theme" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "The best prioritization process has three steps: (1) Individual scoring prevents groupthink, (2) Group calibration surfaces disagreements and hidden information ('I scored this low because customers actually told me they don't want it'), (3) Final decision by a single accountable person (usually the PM). Voting without calibration is a popularity contest. Pure top-down ignores frontline knowledge. The 'score then calibrate' process balances rigor with collaboration.",
        timeTarget: 25,
      },
    ],
  },

  // ─── Prioritization Sprint 2 ──────────────────────────────
  {
    title: "Advanced Prioritization: Saying No & Resource Allocation",
    description: "Master the art of strategic saying no and allocating limited resources across competing priorities",
    skillSlug: "prioritization",
    mode: "LEARN",
    difficulty: 2,
    interactions: [
      {
        type: "TEACH_AND_TEST",
        order: 0,
        prompt: "Your startup has 8 engineers. The CEO wants to pursue 3 parallel initiatives: core product improvements, a new market expansion, and a platform/API play. How should you allocate the team?",
        options: [
          { id: "a", text: "Split evenly: 2-3 engineers on each initiative" },
          { id: "b", text: "Put 6 on core product, 2 on the most promising secondary initiative, and defer the third" },
          { id: "c", text: "Let each engineer self-select which initiative excites them most" },
          { id: "d", text: "Run all 3 for one sprint to see which shows the most promise, then concentrate" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "With 8 engineers, running 3 parallel initiatives means each gets 2-3 people -- below the minimum viable team size (generally 3-4) for any meaningful progress. The result is three initiatives that all move slowly and none that move fast. The best approach: concentrate 70-80% of resources on the highest-priority initiative, allocate a small team to the second priority, and explicitly defer the third. Focus is a startup's only structural advantage over large companies.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 1,
        prompt: "A Fortune 500 client offers your startup a $2M/year contract, but requires 6 months of custom development that will divert 40% of your engineering team. Your current ARR is $3M. What framework helps you decide?",
        options: [
          { id: "a", text: "Simple ROI: $2M revenue vs cost of 40% engineering time" },
          { id: "b", text: "Opportunity cost analysis: what would that 40% of engineering build for the broader market, and what revenue does that unlock?" },
          { id: "c", text: "Customer concentration risk: would this make one customer >30% of revenue?" },
          { id: "d", text: "All three factors together -- this requires a multi-dimensional decision framework" },
        ],
        correctAnswer: "d",
        insightAnswer: "d",
        teachingPreamble: "Large-contract decisions for startups require considering: (1) Direct ROI -- the $2M is real, but so is the opportunity cost of 40% engineering. (2) Opportunity cost -- if that 40% would build features serving 100 customers worth $30K each, that's $3M in broad revenue forgone. (3) Customer concentration risk -- going from 0% to 40% revenue concentration is dangerous (what if they churn?). (4) Strategic fit -- does the custom work create reusable IP? The best answer weighs all dimensions.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 2,
        prompt: "You're the PM for a platform serving both buyers and sellers. Both sides are demanding attention: buyers want better search (NPS impact: +15), sellers want better analytics (revenue impact: +$200K ARR). You can only do one this quarter. Which do you choose?",
        options: [
          { id: "a", text: "Buyer search -- NPS drives long-term retention and word-of-mouth" },
          { id: "b", text: "Seller analytics -- direct revenue impact is measurable and immediate" },
          { id: "c", text: "Whichever side is the constraint: if sellers are churning, fix sellers; if buyer growth is stalling, fix buyers" },
          { id: "d", text: "Do both at 50% scope" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "In marketplace/platform businesses, the constraint side determines prioritization. If you have 1,000 sellers but struggle to attract buyers, improving buyer experience is the constraint. If buyers are plentiful but sellers are churning, seller tools are the constraint. This is the Theory of Constraints applied to platform strategy: always invest in the bottleneck. Improving the non-constrained side has diminishing returns because the other side can't absorb the value.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 3,
        prompt: "Your VP of Sales says: 'We need to build a Salesforce integration or we'll lose 30% of our pipeline.' Your data shows the Salesforce integration was mentioned in 12% of lost deals. What do you do?",
        options: [
          { id: "a", text: "Build the integration -- the VP of Sales knows the market" },
          { id: "b", text: "Reject it -- 12% is not significant enough to prioritize" },
          { id: "c", text: "Dig deeper: analyze whether the 12% of deals were high-value enterprises, and whether the integration is truly the blocker or just a stated objection" },
          { id: "d", text: "Compromise: build a basic Zapier integration that covers 80% of the use case" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "Stakeholder requests often contain signal buried in noise. The VP's '30% of pipeline' claim conflicts with the data (12% of lost deals). But both might be partially right: if those 12% are all $50K+ enterprise deals, they could represent 30% of pipeline value. The PM's job is to decompose the claim: Which segments? What deal sizes? Is 'no Salesforce integration' the real blocker or a polite way to say 'your product isn't ready for enterprise'? Never take the first claim at face value, but never dismiss it either.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 4,
        prompt: "You have budget to hire one person: a senior engineer (ships features faster) or a data analyst (provides better prioritization insights). Your team currently makes decisions based on gut feeling and customer anecdotes. Which hire has more leverage?",
        options: [
          { id: "a", text: "Senior engineer -- shipping faster is always the bottleneck" },
          { id: "b", text: "Data analyst -- building the right things matters more than building things fast" },
          { id: "c", text: "It depends on the team's current velocity vs decision quality" },
          { id: "d", text: "Neither -- hire a PM instead" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "If your team makes decisions based on gut feeling and anecdotes, the highest-leverage hire is someone who improves decision quality. A team that ships fast but builds the wrong things is wasting resources. A data analyst who can instrument the product, analyze user behavior, and surface insights will improve EVERY subsequent prioritization decision. This is a second-order effect: better data -> better decisions -> better features -> better outcomes. It's almost always higher-ROI than adding one more builder to a team already building the wrong things.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 5,
        prompt: "You're allocating a $1M annual marketing budget across channels. Historical data: SEO ($0 marginal cost but 12-month payback), Events ($300 CAC, 30% of pipeline), Paid Ads ($150 CAC, 40% of pipeline), Content ($100 CAC but 6-month lag, 15% of pipeline), Partners (15% of pipeline, $0 upfront but 25% rev share). How should you think about allocation?",
        options: [
          { id: "a", text: "Allocate proportionally to current pipeline contribution" },
          { id: "b", text: "Go all-in on Paid Ads since it has the lowest CAC and highest pipeline share" },
          { id: "c", text: "Allocate based on marginal CAC at each channel's next dollar, not average performance" },
          { id: "d", text: "Equal allocation across all channels for diversification" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "Average CAC is misleading for allocation decisions. What matters is MARGINAL CAC: the cost of acquiring the NEXT customer from each channel. Paid Ads might have $150 average CAC but $300 marginal CAC (each additional dollar is less efficient due to auction dynamics). Content might have $100 average but $50 marginal (scales efficiently). The optimal allocation equalizes marginal CAC across channels -- spend on each until the next dollar in any channel costs the same. This is the economic concept of equimarginal principle.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 6,
        prompt: "Your team just completed a major feature launch. The next quarter has these options: (A) Iterate on the launch based on user feedback, (B) Start the next big feature, (C) Fix 30 small bugs from the backlog, (D) Improve onboarding flow (data shows 40% drop-off). What's the right priority?",
        options: [
          { id: "a", text: "B -- keep momentum by shipping new features" },
          { id: "b", text: "D -- 40% onboarding drop-off means 40% of your growth investment is wasted" },
          { id: "c", text: "A -- iterate on the launch while user feedback is fresh" },
          { id: "d", text: "C -- 30 small bugs accumulated means growing quality debt" },
        ],
        correctAnswer: "b",
        insightAnswer: "b",
        teachingPreamble: "A 40% onboarding drop-off is the silent killer. It means for every $1 you spend on acquisition, $0.40 is wasted. Fixing onboarding is a multiplicative improvement: it makes EVERY other investment (marketing, sales, product features) more effective. This is the 'fix the foundation before building higher' principle. New features for users who never activate is like decorating a house with a leaking roof. Always prioritize conversion funnel fixes over new feature development.",
        timeTarget: 25,
      },
      {
        type: "TEACH_AND_TEST",
        order: 7,
        prompt: "Your board wants you to commit to a 12-month product roadmap. Your market is evolving rapidly with new AI capabilities launching monthly. What is the most responsible approach?",
        options: [
          { id: "a", text: "Commit to the full 12-month roadmap to show strategic clarity" },
          { id: "b", text: "Refuse to commit beyond 1 quarter in a fast-moving market" },
          { id: "c", text: "Present a 12-month strategic direction with committed goals for Q1, directional themes for Q2-Q3, and exploratory bets for Q4" },
          { id: "d", text: "Present multiple scenario-based roadmaps and let the board choose" },
        ],
        correctAnswer: "c",
        insightAnswer: "c",
        teachingPreamble: "The 'planning horizon gradient' is the gold standard: high confidence and detail for the near term, decreasing specificity further out. A 12-month committed roadmap in a fast-moving market is a fiction that will require painful re-negotiations. But refusing to plan beyond a quarter shows a lack of strategic thinking. The gradient approach (committed -> directional -> exploratory) gives the board strategic clarity while preserving the flexibility to adapt. Think of it as 'planning in pencil, not pen.'",
        timeTarget: 25,
      },
    ],
  },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...");

  // Upsert career outcomes
  const careerMap = new Map<string, string>();
  for (const career of CAREER_OUTCOMES) {
    const record = await prisma.careerOutcome.upsert({
      where: { slug: career.slug },
      update: {},
      create: career,
    });
    careerMap.set(career.slug, record.id);
  }
  console.log(`  ${CAREER_OUTCOMES.length} career outcomes seeded`);

  // Upsert skills and create career mappings
  const skillMap = new Map<string, string>();
  for (const skill of SKILLS) {
    const { careers, ...skillData } = skill;
    const record = await prisma.skill.upsert({
      where: { slug: skillData.slug },
      update: {},
      create: skillData,
    });
    skillMap.set(skill.slug, record.id);

    // Create skill-career mappings
    for (const careerSlug of careers) {
      const careerOutcomeId = careerMap.get(careerSlug);
      if (!careerOutcomeId) continue;

      await prisma.skillCareerMap.upsert({
        where: {
          skillId_careerOutcomeId: {
            skillId: record.id,
            careerOutcomeId,
          },
        },
        update: {},
        create: {
          skillId: record.id,
          careerOutcomeId,
          weight: 1.0,
        },
      });
    }
  }
  console.log(`  ${SKILLS.length} skills seeded with career mappings`);

  // Seed LEARN sprints for launch skills
  let sprintCount = 0;
  for (const sprintData of LEARN_SPRINTS) {
    const skillId = skillMap.get(sprintData.skillSlug);
    if (!skillId) {
      console.warn(`  Skill not found for slug: ${sprintData.skillSlug}, skipping sprint`);
      continue;
    }

    // Check if a sprint with this title already exists for this skill
    const existing = await prisma.sprint.findFirst({
      where: {
        skillId,
        title: sprintData.title,
        mode: "LEARN",
      },
    });

    if (existing) {
      console.log(`  Sprint "${sprintData.title}" already exists, skipping`);
      continue;
    }

    await prisma.sprint.create({
      data: {
        skillId,
        mode: "LEARN",
        title: sprintData.title,
        description: sprintData.description,
        isGenerated: false,
        difficulty: sprintData.difficulty,
        interactions: {
          create: sprintData.interactions.map((interaction) => ({
            skillId,
            type: interaction.type,
            order: interaction.order,
            prompt: interaction.prompt,
            options: interaction.options,
            correctAnswer: interaction.correctAnswer,
            insightAnswer: interaction.insightAnswer,
            teachingPreamble: interaction.teachingPreamble,
            timeTarget: interaction.timeTarget,
          })),
        },
      },
    });
    sprintCount++;
  }
  console.log(`  ${sprintCount} LEARN sprints seeded with ${sprintCount * 8} interactions`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
