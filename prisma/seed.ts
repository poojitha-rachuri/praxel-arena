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

// ─── PRACTICE Sprint Data ─────────────────────────────────────────────────────

interface GeneralSprintSeed {
  title: string;
  description: string;
  skillSlug: string;
  mode: "PRACTICE" | "COMPETE";
  difficulty: number;
  interactions: {
    type: string;
    order: number;
    prompt: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    insightAnswer: string;
    priorContext?: string;
    timeTarget: number;
  }[];
}

const PRACTICE_SPRINTS: GeneralSprintSeed[] = [
  {
    title: "Startup Metrics Gauntlet",
    description: "Rapid-fire estimation challenges across SaaS, marketplace, and consumer businesses",
    skillSlug: "guesstimation",
    mode: "PRACTICE",
    difficulty: 2,
    interactions: [
      {
        type: "SPOT_THE_SIGNAL",
        order: 0,
        prompt: "A B2B SaaS shows: MRR $1.2M, YoY growth 85%, net revenue retention 112%, but CAC payback jumped from 8 to 14 months last quarter. What needs immediate attention?",
        options: [
          { id: "a", text: "MRR growth is slowing year-over-year" },
          { id: "b", text: "CAC payback deterioration signals unit economics problem" },
          { id: "c", text: "NRR above 100% is masking a churn issue" },
          { id: "d", text: "Growth rate needs to be higher for this stage" },
        ],
        correctAnswer: "b",
        insightAnswer: "CAC payback nearly doubling in one quarter means acquisition efficiency is degrading fast — this compounds and threatens runway.",
        timeTarget: 10,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 1,
        prompt: "You're estimating TAM for a vertical SaaS serving dentists in the US. Which estimation approach gives the most defensible number?",
        options: [
          { id: "a", text: "Top-down: total healthcare IT spend, then dental share" },
          { id: "b", text: "Bottom-up: number of dentists × annual software budget" },
          { id: "c", text: "Bottom-up first, then validate with top-down triangulation" },
          { id: "d", text: "Comparable company revenue multiples" },
        ],
        correctAnswer: "c",
        insightAnswer: "Bottom-up gives precision for niche markets. Top-down validates the ceiling. Using both and explaining the gap is what senior analysts do.",
        timeTarget: 20,
      },
      {
        type: "FILL_THE_GAP",
        order: 2,
        prompt: "In SaaS unit economics, ___ measures how many months of gross profit it takes to recover the cost of acquiring a customer.",
        options: [
          { id: "a", text: "LTV:CAC ratio" },
          { id: "b", text: "CAC payback period" },
          { id: "c", text: "Gross margin" },
          { id: "d", text: "Net revenue retention" },
        ],
        correctAnswer: "b",
        insightAnswer: "CAC payback period = CAC / (ARPU × Gross Margin). A healthy SaaS targets under 18 months.",
        timeTarget: 10,
      },
      {
        type: "SPOT_THE_SIGNAL",
        order: 3,
        prompt: "A food delivery marketplace: GMV $50M/month, take rate 22%, order volume flat for 3 months, but average order value up 15%. What's the most likely explanation?",
        options: [
          { id: "a", text: "Customers ordering from premium restaurants" },
          { id: "b", text: "Platform added delivery surcharges" },
          { id: "c", text: "Fewer customers placing larger consolidated orders" },
          { id: "d", text: "Menu price inflation flowing through to GMV" },
        ],
        correctAnswer: "c",
        insightAnswer: "Flat orders + rising AOV typically means customer consolidation. But the deepest insight is checking for hidden price inflation — it inflates GMV without real growth.",
        timeTarget: 10,
      },
      {
        type: "RANK_AND_PRIORITIZE",
        order: 4,
        prompt: "Rank these approaches to estimate Spotify's annual podcast ad revenue from most to least reliable:",
        options: [
          { id: "a", text: "Spotify's reported ad revenue × podcast share estimate" },
          { id: "b", text: "Podcast listeners × CPM × estimated ad loads per hour" },
          { id: "c", text: "Total podcast ad industry × Spotify's market share" },
          { id: "d", text: "Ad-supported MAUs × estimated ad revenue per user" },
        ],
        correctAnswer: "a,b,c,d",
        insightAnswer: "Company-reported data (A) is the most reliable anchor. Bottom-up user math (B) next. Market share triangulation (C) adds a check. Broad averages (D) are the least precise.",
        timeTarget: 25,
      },
      {
        type: "FILL_THE_GAP",
        order: 5,
        prompt: "When estimating market size, ___ is the portion of TAM that your product could realistically capture within 3-5 years given current resources and go-to-market.",
        options: [
          { id: "a", text: "SAM (Serviceable Addressable Market)" },
          { id: "b", text: "SOM (Serviceable Obtainable Market)" },
          { id: "c", text: "TAM (Total Addressable Market)" },
          { id: "d", text: "ACV (Annual Contract Value)" },
        ],
        correctAnswer: "b",
        insightAnswer: "SOM is the realistic capture target. SAM is what you could theoretically serve. TAM is the total opportunity. Investors want all three but care most about SOM credibility.",
        timeTarget: 10,
      },
      {
        type: "CURVEBALL",
        order: 6,
        prompt: "Returning to the food delivery marketplace: you now learn they quietly raised the minimum order from $10 to $20 last quarter. How does this change your interpretation of flat orders + rising AOV?",
        priorContext: "Earlier data showed GMV $50M/month, flat order volume, but 15% AOV increase over 3 months.",
        options: [
          { id: "a", text: "AOV increase is artificial — small orders were eliminated" },
          { id: "b", text: "It proves the platform is optimizing for profitability" },
          { id: "c", text: "Actual customer demand is declining, hidden by the minimum" },
          { id: "d", text: "Both A and C — the minimum created survivor bias in metrics" },
        ],
        correctAnswer: "d",
        insightAnswer: "The minimum order killed low-value orders (inflating AOV) while masking a decline in true demand. This is classic survivor bias — the metrics look stable but the underlying behavior degraded.",
        timeTarget: 20,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 7,
        prompt: "Your VC fund evaluates a $10M Series A. Bottom-up TAM says $800M, top-down says $2.4B. The 3x gap matters for your thesis. What do you do?",
        options: [
          { id: "a", text: "Average them at $1.6B — truth is in the middle" },
          { id: "b", text: "Use bottom-up — more rigorous for early markets" },
          { id: "c", text: "Investigate which assumptions drive the 3x gap and model scenarios" },
          { id: "d", text: "Use top-down — VCs should invest in large markets" },
        ],
        correctAnswer: "c",
        insightAnswer: "The gap itself is the most valuable information. Identifying whether it's driven by adoption rate, pricing, or market definition tells you where the investment risk actually lives.",
        timeTarget: 20,
      },
    ],
  },
  {
    title: "Channel Strategy Battlefield",
    description: "Navigate GTM channel decisions under pressure with incomplete information",
    skillSlug: "gtm-strategy",
    mode: "PRACTICE",
    difficulty: 2,
    interactions: [
      {
        type: "SPOT_THE_SIGNAL",
        order: 0,
        prompt: "Your SaaS channel data: Organic search 40% of signups (free), Paid ads 35% ($180 CAC), Partnerships 25% ($90 CAC). But paid ads have 3x higher activation rate than organic. Where should you double investment?",
        options: [
          { id: "a", text: "Organic — it's free and highest volume" },
          { id: "b", text: "Paid ads — higher activation means better effective CAC" },
          { id: "c", text: "Partnerships — lowest stated CAC wins" },
          { id: "d", text: "Split evenly across all three channels" },
        ],
        correctAnswer: "b",
        insightAnswer: "CAC alone misleads. Paid ads at $180 CAC but 3x activation means effective cost per activated user is lower. Always compare CAC-to-activated, not CAC-to-signup.",
        timeTarget: 10,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 1,
        prompt: "Launching a dev tool. Two beta strategies: (A) Product Hunt launch — 10K+ potential signups, broad visibility. (B) Hand-select 50 developers from your waitlist for deep feedback. Which builds better product-market fit?",
        options: [
          { id: "a", text: "Product Hunt — volume helps you find signal faster" },
          { id: "b", text: "Hand-selected 50 — deep ICP feedback beats vanity signups" },
          { id: "c", text: "Both simultaneously for volume and depth" },
          { id: "d", text: "Skip beta — launch publicly with content marketing" },
        ],
        correctAnswer: "b",
        insightAnswer: "50 deeply engaged ICP users generate more learning than 10K drive-by signups. PH launches optimize for buzz, not PMF. Sequence: deep beta first, then public launch with a refined product.",
        timeTarget: 20,
      },
      {
        type: "FILL_THE_GAP",
        order: 2,
        prompt: "In product-led growth, the ___ is the moment a new user first experiences the core value that makes them want to continue using the product.",
        options: [
          { id: "a", text: "Activation event" },
          { id: "b", text: "Aha moment" },
          { id: "c", text: "Conversion trigger" },
          { id: "d", text: "Retention hook" },
        ],
        correctAnswer: "b",
        insightAnswer: "The 'aha moment' is distinct from activation (a measured event) — it's the emotional realization of value. Slack's aha moment is when a team exchanges 2,000 messages; Dropbox's is the first file synced across devices.",
        timeTarget: 10,
      },
      {
        type: "SPOT_THE_SIGNAL",
        order: 3,
        prompt: "Content marketing dashboard: Blog traffic up 150% YoY, newsletter subs up 80%, social shares doubled, but demo requests flat. What's the real diagnosis?",
        options: [
          { id: "a", text: "SEO is working but content targets wrong intent" },
          { id: "b", text: "CTAs are broken or poorly positioned" },
          { id: "c", text: "The growing audience isn't your ICP" },
          { id: "d", text: "Newsletter nurture sequence needs improvement" },
        ],
        correctAnswer: "a",
        insightAnswer: "The deeper insight: if traffic, shares, and subs all grow but demos don't, the audience itself is wrong. Top-of-funnel content attracts readers, not buyers. Shift to bottom-of-funnel content targeting buyer intent.",
        timeTarget: 10,
      },
      {
        type: "RANK_AND_PRIORITIZE",
        order: 4,
        prompt: "Rank these GTM motions by typical time-to-first-revenue for a new B2B SaaS (fastest first):",
        options: [
          { id: "a", text: "Content marketing and SEO" },
          { id: "b", text: "Outbound sales with SDR team" },
          { id: "c", text: "Channel partnerships and resellers" },
          { id: "d", text: "Product-led growth with freemium" },
        ],
        correctAnswer: "b,d,c,a",
        insightAnswer: "Outbound (B) closes in 2-6 weeks. PLG (D) converts in 1-2 months. Partnerships (C) take 3-6 months to activate. Content/SEO (A) takes 6-12 months to compound. Sequence your motions accordingly.",
        timeTarget: 25,
      },
      {
        type: "FILL_THE_GAP",
        order: 5,
        prompt: "The ___ metric compares lifetime customer value to acquisition cost, and a ratio below 3:1 is generally considered unsustainable for SaaS businesses.",
        options: [
          { id: "a", text: "ROAS (Return on Ad Spend)" },
          { id: "b", text: "LTV:CAC ratio" },
          { id: "c", text: "NRR (Net Revenue Retention)" },
          { id: "d", text: "Gross margin percentage" },
        ],
        correctAnswer: "b",
        insightAnswer: "LTV:CAC > 3:1 is the standard. Below 3:1, you're spending too much to acquire customers relative to what they pay you. Above 5:1, you might be underinvesting in growth.",
        timeTarget: 10,
      },
      {
        type: "CURVEBALL",
        order: 6,
        prompt: "Your outbound sales team was your fastest channel. But a competitor just raised $50M and is hiring 200 SDRs. Your 10-person team can't match their volume. How do you respond?",
        priorContext: "Earlier you ranked outbound sales as the fastest GTM motion for time-to-first-revenue.",
        options: [
          { id: "a", text: "Raise funding to match their headcount" },
          { id: "b", text: "Shift entirely to product-led growth" },
          { id: "c", text: "Double down on targeting and personalization — win on quality" },
          { id: "d", text: "Build channel partnerships to access customers indirectly" },
        ],
        correctAnswer: "c",
        insightAnswer: "Volume wars favor the better-funded competitor. A 10-person team with 8% meeting rate beats a 200-person team with 1% meeting rate on efficiency. Hyper-personalization is the asymmetric advantage.",
        timeTarget: 20,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 7,
        prompt: "$200K remaining in Q4 budget. Option A: Sponsor a major industry conference ($200K, 5,000 attendees, your ICP). Option B: Targeted ABM campaign against 200 enterprise accounts ($200K, personalized multi-touch). Which maximizes Q1 pipeline?",
        options: [
          { id: "a", text: "Conference — brand visibility and 5,000 potential leads" },
          { id: "b", text: "ABM — focused spend on named accounts converts better" },
          { id: "c", text: "Split $100K each for brand and pipeline" },
          { id: "d", text: "Save it for Q1 when buyers have new budgets" },
        ],
        correctAnswer: "b",
        insightAnswer: "For pipeline generation (not brand awareness), ABM consistently outperforms events. $1,000 per account for personalized multi-touch yields 15-30% meeting rates vs. conference's 2-5% lead quality.",
        timeTarget: 20,
      },
    ],
  },
  {
    title: "Tradeoff Bootcamp",
    description: "Navigate competing priorities with limited resources and imperfect information",
    skillSlug: "prioritization",
    mode: "PRACTICE",
    difficulty: 2,
    interactions: [
      {
        type: "SPOT_THE_SIGNAL",
        order: 0,
        prompt: "Product backlog: 45 items, 8 flagged critical by customers, avg item age 47 days, 3 items blocking engineering work, last shipped feature increased retention 12%. What should you act on first?",
        options: [
          { id: "a", text: "The 8 customer-critical items" },
          { id: "b", text: "The 3 engineering blockers — unblocking creates capacity" },
          { id: "c", text: "The stale items — high age signals broken process" },
          { id: "d", text: "Replicate the retention-boosting feature pattern" },
        ],
        correctAnswer: "b",
        insightAnswer: "Engineering blockers are force multipliers — unblocking them creates capacity to tackle everything else. Always clear constraints before optimizing throughput.",
        timeTarget: 10,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 1,
        prompt: "Feature A saves 2,000 users 10 min/week each. Feature B saves 5 power users 8 hours/week each. Same engineering effort. Which do you prioritize?",
        options: [
          { id: "a", text: "Feature A — 333 hours saved weekly across all users" },
          { id: "b", text: "Feature B — power users are likely enterprise worth 50x" },
          { id: "c", text: "Feature A — democratized impact is more defensible" },
          { id: "d", text: "Need revenue data on affected users before deciding" },
        ],
        correctAnswer: "a",
        insightAnswer: "Feature A's 333 hours/week dwarfs Feature B's 40 hours/week. But the deeper question is revenue-weighted impact — if those 5 power users generate 60% of revenue, B wins. Always ask: hours saved for whom?",
        timeTarget: 20,
      },
      {
        type: "FILL_THE_GAP",
        order: 2,
        prompt: "The RICE prioritization framework scores features on Reach, Impact, ___, and Effort.",
        options: [
          { id: "a", text: "Importance" },
          { id: "b", text: "Confidence" },
          { id: "c", text: "Innovation" },
          { id: "d", text: "Cost" },
        ],
        correctAnswer: "b",
        insightAnswer: "Confidence is RICE's secret weapon — it penalizes speculative high-impact features and rewards well-understood improvements. It forces intellectual honesty about what you actually know.",
        timeTarget: 10,
      },
      {
        type: "SPOT_THE_SIGNAL",
        order: 3,
        prompt: "Sprint velocity: Weeks 1-4 avg 42 points, Week 5 drops to 28, Weeks 6-8 avg 25 points. Bug reports doubled in Week 5. What happened?",
        options: [
          { id: "a", text: "Team burnout — they need recovery time" },
          { id: "b", text: "Tech debt hit a tipping point — bugs consume capacity" },
          { id: "c", text: "Scope creep in Week 5 caused cascading delays" },
          { id: "d", text: "A key contributor left or went on vacation" },
        ],
        correctAnswer: "b",
        insightAnswer: "Bug reports doubling coinciding with velocity drop is the classic tech debt tipping point. Bugs create more bugs, and fixing them steals time from features. This pattern demands an immediate debt sprint.",
        timeTarget: 10,
      },
      {
        type: "RANK_AND_PRIORITIZE",
        order: 4,
        prompt: "Rank these startup investments by expected 12-month ROI (highest first):",
        options: [
          { id: "a", text: "Second sales rep ($80K, +$400K expected revenue)" },
          { id: "b", text: "Redesign onboarding (2 weeks eng, +15% activation)" },
          { id: "c", text: "SOC 2 compliance (3 months, unlocks enterprise)" },
          { id: "d", text: "Page speed: 4s → 1s (1 week eng, +8% conversion)" },
        ],
        correctAnswer: "d,b,a,c",
        insightAnswer: "Quick wins first: page speed (D) is 1 week for 8% lift. Onboarding (B) is 2 weeks for 15% activation boost. Sales hire (A) delivers ongoing ROI. SOC 2 (C) unlocks long-term enterprise but takes 3 months.",
        timeTarget: 25,
      },
      {
        type: "FILL_THE_GAP",
        order: 5,
        prompt: "The ___ principle states that optimizing any part of a system other than the bottleneck is an illusion of improvement.",
        options: [
          { id: "a", text: "Pareto Principle" },
          { id: "b", text: "Theory of Constraints" },
          { id: "c", text: "Lean methodology" },
          { id: "d", text: "Agile manifesto" },
        ],
        correctAnswer: "b",
        insightAnswer: "Goldratt's Theory of Constraints: a chain is only as strong as its weakest link. Improving non-bottleneck steps creates idle inventory, not throughput. Identify your constraint first, always.",
        timeTarget: 10,
      },
      {
        type: "CURVEBALL",
        order: 6,
        prompt: "You chose the page speed fix as top priority (1 week for 8% lift). But your CTO says the issue requires a full architectural migration — 8 weeks, not 1. How do you adjust?",
        priorContext: "Earlier, you ranked page speed optimization as the #1 quick win based on a 1-week estimate.",
        options: [
          { id: "a", text: "Still prioritize it — 8% conversion is worth 8 weeks" },
          { id: "b", text: "Drop it to #3 — do onboarding and sales hire first" },
          { id: "c", text: "Find a partial fix (caching, lazy loading) for 60% of the benefit in 1 week" },
          { id: "d", text: "Negotiate with the vendor causing the bottleneck" },
        ],
        correctAnswer: "c",
        insightAnswer: "The 80/20 rule: a partial fix (CDN caching, lazy loading, code splitting) often captures most of the performance benefit at a fraction of the effort. Ship the quick win, then plan the full migration.",
        timeTarget: 20,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 7,
        prompt: "End of quarter. Feature X is 90% done (2 days left) but no customers asked for it. Feature Y was requested by 5 top accounts but is only 40% done (needs 8 days, quarter ends in 5). What do you ship?",
        options: [
          { id: "a", text: "Feature X — sunk cost is real, finish what you started" },
          { id: "b", text: "Feature Y partial — even an incomplete version addresses the need" },
          { id: "c", text: "Neither — ship quality, re-plan next quarter" },
          { id: "d", text: "Feature X now, then crunch for Feature Y" },
        ],
        correctAnswer: "b",
        insightAnswer: "Sunk cost fallacy makes X feel right, but shipping something nobody wants is waste. A partial Feature Y — even 60% scope — shows customers you're listening and buys goodwill. Ship value, not completion.",
        timeTarget: 20,
      },
    ],
  },
];

// ─── COMPETE Sprint Data (Pre-cached for demo safety) ─────────────────────────

const COMPETE_SPRINTS: GeneralSprintSeed[] = [
  {
    title: "Valuing NovaPay: FinTech Sizing Sprint",
    description: "Evaluate a $500M Series D investment in a B2B payments startup facing competitive pressure",
    skillSlug: "guesstimation",
    mode: "COMPETE",
    difficulty: 3,
    interactions: [
      {
        type: "SPOT_THE_SIGNAL",
        order: 0,
        prompt: "NovaPay processes $2B in annual payment volume at a 2.1% take rate. Revenue $42M, gross margin 68%, YoY growth 110%, but Q4 growth decelerated to 80% annualized. What is the key signal?",
        options: [
          { id: "a", text: "Revenue growth deceleration from 110% to 80%" },
          { id: "b", text: "Healthy 68% gross margin validates the model" },
          { id: "c", text: "$42M revenue is impressive for B2B payments" },
          { id: "d", text: "2.1% take rate is competitive in payments" },
        ],
        correctAnswer: "a",
        insightAnswer: "Growth deceleration is the single most important signal for growth-stage valuation. A 30-point drop in one quarter compounds — if the trend continues, the company's forward revenue multiple collapses.",
        timeTarget: 10,
      },
      {
        type: "SPOT_THE_SIGNAL",
        order: 1,
        prompt: "NovaPay's cohort data: 2022 cohort retains 95% of payment volume, 2023 retains 88%, 2024 retains only 72% after 6 months. New customer acquisition is 3x higher than 2022. What does the data really say?",
        options: [
          { id: "a", text: "Customer quality is declining as they scale acquisition" },
          { id: "b", text: "2024 cohort needs more time to ramp up" },
          { id: "c", text: "Net revenue retention is still strong overall" },
          { id: "d", text: "Normal — newer cohorts always start lower" },
        ],
        correctAnswer: "a",
        insightAnswer: "Declining cohort retention + aggressive acquisition = classic 'growth masking churn.' They're acquiring faster to offset worsening retention. This is unsustainable.",
        timeTarget: 10,
      },
      {
        type: "FILL_THE_GAP",
        order: 2,
        prompt: "In payments, ___ measures total dollar value of transactions processed and is the standard top-line metric before applying take rate.",
        options: [
          { id: "a", text: "GMV (Gross Merchandise Value)" },
          { id: "b", text: "TPV (Total Payment Volume)" },
          { id: "c", text: "ARR (Annual Recurring Revenue)" },
          { id: "d", text: "ATV (Average Transaction Value)" },
        ],
        correctAnswer: "b",
        insightAnswer: "TPV is the payments industry standard. GMV is used for marketplaces. Revenue = TPV × take rate. Understanding this conversion is critical for payments valuation.",
        timeTarget: 10,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 3,
        prompt: "Two valuation approaches: (A) Revenue multiple — comparable payment cos trade at 15x, giving $630M at $42M revenue. (B) TPV multiple — 0.3x TPV gives $600M on $2B volume. Which is more reliable at this stage?",
        options: [
          { id: "a", text: "Revenue multiple — standard for growth-stage" },
          { id: "b", text: "TPV multiple — captures true economic activity" },
          { id: "c", text: "Revenue multiple but discount 20% for growth deceleration" },
          { id: "d", text: "Use both and take the midpoint for triangulation" },
        ],
        correctAnswer: "c",
        insightAnswer: "Revenue multiples are standard but must be adjusted for growth trajectory. A company decelerating from 110% to 80% doesn't deserve the same multiple as one accelerating. The 20% discount reflects this.",
        timeTarget: 20,
      },
      {
        type: "RANK_AND_PRIORITIZE",
        order: 4,
        prompt: "Rank NovaPay's growth levers by expected 12-month revenue impact (highest first):",
        options: [
          { id: "a", text: "Expand internationally into 10 new markets" },
          { id: "b", text: "Increase take rate from 2.1% to 2.5% on existing volume" },
          { id: "c", text: "Cross-sell lending products to merchant base" },
          { id: "d", text: "Reduce 2024 cohort churn from 28% to 15%" },
        ],
        correctAnswer: "b,d,c,a",
        insightAnswer: "Take rate increase (B) is an immediate 19% revenue uplift on $2B volume. Churn fix (D) saves declining cohorts. Cross-sell (C) requires new products. International (A) has longest lead time and execution risk.",
        timeTarget: 25,
      },
      {
        type: "FILL_THE_GAP",
        order: 5,
        prompt: "A payment company's ___ is calculated as revenue divided by total payment volume, representing its monetization efficiency per dollar processed.",
        options: [
          { id: "a", text: "Gross margin" },
          { id: "b", text: "Conversion rate" },
          { id: "c", text: "Take rate" },
          { id: "d", text: "ARPU" },
        ],
        correctAnswer: "c",
        insightAnswer: "Take rate = Revenue / TPV. It measures how effectively a payment company monetizes each dollar flowing through. Stripe's is ~2.9%, PayPal's ~2.2%, wholesale processors ~0.3%.",
        timeTarget: 10,
      },
      {
        type: "CURVEBALL",
        order: 6,
        prompt: "Breaking: Stripe just announced a competing B2B product at 1.5% take rate (vs NovaPay's 2.1%). Your earlier plan to raise take rate to 2.5% is now risky. How does this change the investment thesis?",
        priorContext: "You previously ranked 'increase take rate from 2.1% to 2.5%' as the #1 growth lever, worth a 19% revenue uplift.",
        options: [
          { id: "a", text: "Too risky now — Stripe will crush them on price" },
          { id: "b", text: "Pivot thesis: retention + cross-sell become primary drivers" },
          { id: "c", text: "NovaPay should preemptively cut to 1.8% to defend share" },
          { id: "d", text: "Stripe's entry validates the market — bullish signal" },
        ],
        correctAnswer: "b",
        insightAnswer: "With Stripe competing on price, take rate expansion is off the table. The thesis must pivot to retention and cross-sell. If NovaPay's value is just processing, Stripe wins. If it's the merchant relationship, NovaPay can defend.",
        timeTarget: 20,
      },
      {
        type: "FORCED_TRADEOFF",
        order: 7,
        prompt: "Final call: given Stripe's entry, declining cohort quality, and growth deceleration, do you recommend the $500M Series D at 12x forward revenue ($504M valuation)?",
        options: [
          { id: "a", text: "Yes — fundamentals are strong, Stripe is manageable" },
          { id: "b", text: "Yes, but negotiate down to 8x ($336M) for the new risks" },
          { id: "c", text: "No — deteriorating cohorts + Stripe signal a ceiling" },
          { id: "d", text: "Pass now, revisit in 6 months after Stripe response" },
        ],
        correctAnswer: "b",
        insightAnswer: "The business has real value but the risk profile changed. Negotiating to 8x prices in the growth deceleration and competitive threat while still capturing the upside. Passing entirely might mean missing the window.",
        timeTarget: 20,
      },
    ],
  },
];

// Demo opponent's responses for the pre-cached COMPETE sprint (gets ~5/8 correct — competitive but beatable)
const DEMO_OPPONENT_RESPONSES = [
  { interactionIndex: 0, answer: "b", timeSpent: 8 },   // wrong (chose gross margin, not deceleration)
  { interactionIndex: 1, answer: "a", timeSpent: 7 },   // correct
  { interactionIndex: 2, answer: "b", timeSpent: 5 },   // correct
  { interactionIndex: 3, answer: "d", timeSpent: 14 },  // wrong (chose midpoint, not adjusted multiple)
  { interactionIndex: 4, answer: "b,d,c,a", timeSpent: 18 }, // correct
  { interactionIndex: 5, answer: "c", timeSpent: 4 },   // correct
  { interactionIndex: 6, answer: "d", timeSpent: 12 },  // wrong (chose "validates market" instead of pivot)
  { interactionIndex: 7, answer: "b", timeSpent: 15 },  // correct
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

  // Seed PRACTICE sprints
  let practiceCount = 0;
  for (const sprintData of PRACTICE_SPRINTS) {
    const skillId = skillMap.get(sprintData.skillSlug);
    if (!skillId) {
      console.warn(`  Skill not found for slug: ${sprintData.skillSlug}, skipping sprint`);
      continue;
    }

    const existing = await prisma.sprint.findFirst({
      where: { skillId, title: sprintData.title, mode: "PRACTICE" },
    });
    if (existing) {
      console.log(`  Sprint "${sprintData.title}" already exists, skipping`);
      continue;
    }

    await prisma.sprint.create({
      data: {
        skillId,
        mode: "PRACTICE",
        title: sprintData.title,
        description: sprintData.description,
        isGenerated: false,
        difficulty: sprintData.difficulty,
        interactions: {
          create: sprintData.interactions.map((interaction) => ({
            skillId,
            type: interaction.type as "SPOT_THE_SIGNAL" | "FORCED_TRADEOFF" | "FILL_THE_GAP" | "RANK_AND_PRIORITIZE" | "CURVEBALL",
            order: interaction.order,
            prompt: interaction.prompt,
            options: interaction.options,
            correctAnswer: interaction.correctAnswer,
            insightAnswer: interaction.insightAnswer,
            priorContext: interaction.priorContext ?? null,
            timeTarget: interaction.timeTarget,
          })),
        },
      },
    });
    practiceCount++;
  }
  console.log(`  ${practiceCount} PRACTICE sprints seeded`);

  // Seed COMPETE sprints (pre-cached for demo safety)
  let competeCount = 0;
  const competeSprintIds = new Map<string, string>(); // skillSlug -> sprintId
  for (const sprintData of COMPETE_SPRINTS) {
    const skillId = skillMap.get(sprintData.skillSlug);
    if (!skillId) {
      console.warn(`  Skill not found for slug: ${sprintData.skillSlug}, skipping sprint`);
      continue;
    }

    const existing = await prisma.sprint.findFirst({
      where: { skillId, title: sprintData.title, mode: "COMPETE" },
      include: { interactions: { orderBy: { order: "asc" } } },
    });
    if (existing) {
      console.log(`  Sprint "${sprintData.title}" already exists, skipping`);
      competeSprintIds.set(sprintData.skillSlug, existing.id);
      continue;
    }

    const sprint = await prisma.sprint.create({
      data: {
        skillId,
        mode: "COMPETE",
        title: sprintData.title,
        description: sprintData.description,
        isGenerated: false,
        difficulty: sprintData.difficulty,
        interactions: {
          create: sprintData.interactions.map((interaction) => ({
            skillId,
            type: interaction.type as "SPOT_THE_SIGNAL" | "FORCED_TRADEOFF" | "FILL_THE_GAP" | "RANK_AND_PRIORITIZE" | "CURVEBALL",
            order: interaction.order,
            prompt: interaction.prompt,
            options: interaction.options,
            correctAnswer: interaction.correctAnswer,
            insightAnswer: interaction.insightAnswer,
            priorContext: interaction.priorContext ?? null,
            timeTarget: interaction.timeTarget,
          })),
        },
      },
    });
    competeSprintIds.set(sprintData.skillSlug, sprint.id);
    competeCount++;
  }
  console.log(`  ${competeCount} COMPETE sprints seeded`);

  // ─── Demo Opponent Setup ─────────────────────────────────────────────────
  // Create a demo opponent user + pre-completed duel for demo safety.
  // When the real user hits "Compete" on Guesstimation, they'll match with this
  // pre-existing WAITING duel where the opponent has already completed the sprint.

  const DEMO_CLERK_ID = "demo_opponent_001";
  const DEMO_EMAIL = "alex.chen@praxel-arena.demo";

  let demoUser = await prisma.user.findUnique({ where: { clerkId: DEMO_CLERK_ID } });
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        clerkId: DEMO_CLERK_ID,
        email: DEMO_EMAIL,
        name: "Alex Chen",
        imageUrl: null,
        onboardingComplete: true,
      },
    });
    console.log("  Demo opponent user created: Alex Chen");
  } else {
    console.log("  Demo opponent user already exists");
  }

  // Create demo Elo rating for guesstimation (slightly above average)
  const guesstimationSkillId = skillMap.get("guesstimation");
  if (guesstimationSkillId) {
    await prisma.userEloRating.upsert({
      where: {
        userId_skillId: { userId: demoUser.id, skillId: guesstimationSkillId },
      },
      update: {},
      create: {
        userId: demoUser.id,
        skillId: guesstimationSkillId,
        rating: 1250,
        matchCount: 7,
      },
    });

    // Create demo skill scores (shows on their profile in MatchResult)
    await prisma.userSkillScore.upsert({
      where: {
        userId_skillId: { userId: demoUser.id, skillId: guesstimationSkillId },
      },
      update: {},
      create: {
        userId: demoUser.id,
        skillId: guesstimationSkillId,
        analyticalThinking: 72,
        strategicReasoning: 68,
        quantitativeReasoning: 75,
        communicationClarity: 65,
        decisionQuality: 70,
        creativeProblemSolving: 63,
        overallScore: 68.8,
        sprintCount: 7,
      },
    });

    // Set up the pre-cached duel if a COMPETE sprint exists
    const competeSprintId = competeSprintIds.get("guesstimation");
    if (competeSprintId) {
      // Check if a demo duel already exists
      const existingDuel = await prisma.duel.findFirst({
        where: {
          player1Id: demoUser.id,
          skillId: guesstimationSkillId,
          status: "WAITING",
        },
      });

      if (!existingDuel) {
        // Load the sprint's interactions to build the opponent's responses
        const sprintWithInteractions = await prisma.sprint.findUnique({
          where: { id: competeSprintId },
          include: { interactions: { orderBy: { order: "asc" } } },
        });

        if (sprintWithInteractions) {
          // Create the demo opponent's SprintAttempt with pre-determined responses
          const demoResponses = sprintWithInteractions.interactions.map((interaction, idx) => ({
            interactionId: interaction.id,
            answer: DEMO_OPPONENT_RESPONSES[idx]?.answer ?? "a",
            timeSpent: DEMO_OPPONENT_RESPONSES[idx]?.timeSpent ?? 10,
          }));

          const demoAttempt = await prisma.sprintAttempt.create({
            data: {
              userId: demoUser.id,
              sprintId: competeSprintId,
              mode: "COMPETE",
              responses: demoResponses,
              scores: {
                analyticalThinking: 70,
                strategicReasoning: 65,
                quantitativeReasoning: 72,
                communicationClarity: 62,
                decisionQuality: 68,
                creativeProblemSolving: 60,
              },
              totalScore: 66.2,
              completedAt: new Date(),
            },
          });

          // Create the WAITING duel with the opponent's attempt already linked
          await prisma.duel.create({
            data: {
              skillId: guesstimationSkillId,
              sprintId: competeSprintId,
              player1Id: demoUser.id,
              player1AttemptId: demoAttempt.id,
              status: "WAITING",
            },
          });

          console.log("  Demo duel created: WAITING with pre-completed opponent attempt");
        }
      } else {
        console.log("  Demo duel already exists, skipping");
      }
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
