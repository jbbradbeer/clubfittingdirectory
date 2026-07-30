import type { Guide } from "@/lib/guides/types"

export const shaftFittingGuide: Guide = {
  slug: "shaft-fitting",
  metaTitle: "Golf Shaft Fitting: How It Works & Is It Worth It? (2026)",
  metaDescription:
    "How golf shaft fitting works: what flex, weight, torque, and kick point actually do, why swing speed charts mislead, what a shaft-only refit costs, and when it's worth it.",
  targetKeyword: "shaft fitting golf",
  eyebrow: "Fitting Glossary",
  h1: "Golf Shaft Fitting: How It Works and When It's Worth It",
  excerpt:
    "The shaft is the only part of the club your hands ever load, and it controls delivery — where the face points and how the club arrives at the ball. Here's what a shaft fitting tests, why flex charts are only a starting point, and when a shaft-only refit beats buying new clubs.",
  keyTakeaways: [
    "A shaft fitting matches five properties — flex, weight, torque, kick point, and material — to your swing using launch monitor data, not a swing speed chart.",
    "Flex charts are a starting point, not an answer: two golfers with identical swing speeds can need different shafts because tempo, transition, and release point load the shaft differently.",
    "Shaft weight is often the bigger lever than flex — a shaft that's too light for your tempo hurts consistency more than being one flex label off.",
    "You can refit shafts into clubheads you already own: a shaft-only refit typically runs from under $100 for a stock steel iron shaft to $200–$500+ for a premium aftermarket driver shaft, installed.",
    "A shaft fitting is worth it when your contact is reasonably repeatable and your miss is consistent; it can't fix a swing that produces a different fault every time.",
  ],
  readMinutes: 9,
  datePublished: "2026-07-29",
  dateModified: "2026-07-29",
  blocks: [
    {
      type: "paragraph",
      text: "Golfers obsess over clubheads because clubheads are what the marketing sells. Fitters obsess over shafts because the shaft is what actually delivers the head. The head determines what happens at the instant of impact; the shaft determines where the head is, how fast it's moving, and where the face points when that instant arrives. That's why a fitting that changes nothing but the shaft can transform how the same clubhead performs.",
    },
    {
      type: "paragraph",
      text: [
        "This guide covers what a shaft fitting actually tests, what each shaft property does, why the swing speed charts printed on shaft bands are only a rough guide, and when a shaft-only refit is the smarter buy. If you want the full picture of a complete fitting session, start with our ",
        { text: "complete guide to golf club fitting", href: "/guides/golf-club-fitting" },
        ".",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "What the shaft actually controls",
    },
    {
      type: "paragraph",
      text: "A golf shaft has five properties a fitting evaluates. Each one changes how the club loads during the downswing and how the face is delivered at impact:",
    },
    {
      type: "list",
      items: [
        [
          { text: "Flex", href: "/tools/golf-shaft-flex-calculator" },
          " — how much the shaft bends under load. Labels run from Ladies (L) through Senior (A), Regular (R), Stiff (S), and Extra Stiff (X). A shaft that's too stiff for your speed and tempo tends to launch low with the face open; one that's too soft can launch high, spin more, and make face control inconsistent. Critically, flex labels are not standardized — one company's stiff can measure like another company's regular.",
        ],
        "Weight — measured in grams, roughly 40–85g for graphite driver shafts and 85–130g for steel iron shafts. Weight is the property fitters change most often. Too light and your tempo can get quick and handsy; too heavy and you lose speed and finish tired. The right weight is the heaviest shaft you can swing at full speed without losing your sequence.",
        "Torque — how much the shaft resists twisting, measured in degrees. Lower torque (2–3°) resists twisting and suits stronger, faster swings; higher torque (4–6°) twists more easily and can feel smoother for moderate speeds. Torque influences feel and how much an off-center strike opens or closes the face.",
        [
          { text: "Kick point", href: "/guides/kick-point" },
          " (also called bend point) — where along its length the shaft bends most. A low kick point helps the ball launch higher; a high kick point keeps launch and spin down. It's a real variable, but a subtler one than flex and weight — we cover it in detail in its own glossary entry.",
        ],
        "Material — steel vs. graphite. Steel is heavier, more consistent shaft-to-shaft, and transmits more feedback; it remains the default in irons for faster swingers. Graphite is lighter, dampens vibration, and lets slower swingers generate more clubhead speed; it's universal in drivers and increasingly common in irons for golfers who benefit from the weight savings, including many seniors and players with joint pain.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "How a fitter actually tests shafts",
    },
    {
      type: "paragraph",
      text: "A shaft fitting is a data exercise. You hit balls, the launch monitor records what happened, and each candidate shaft either beats your baseline or it doesn't. The numbers the fitter watches:",
    },
    {
      type: "list",
      items: [
        "Ball speed — the raw output. A better-matched shaft often adds ball speed not by magic, but by letting you deliver the face more squarely more often.",
        "Launch angle and spin rate — the pair that determines carry distance. Most fitting decisions are about moving these two numbers into the efficient window for your ball speed. A shaft change of one flex or 10–15 grams can visibly shift both.",
        "Dispersion — the shape and size of your shot pattern across 8–10 swings. This is the number that matters most for scoring. A shaft that adds five yards on your best swing but doubles the width of your pattern is a worse shaft.",
        "Consistency of strike — where on the face you're hitting it, read from impact location. A shaft with the wrong weight or balance point often shows up as a wandering strike pattern before it shows up anywhere else.",
      ],
    },
    {
      type: "paragraph",
      text: "The sequence at a good shop: baseline with your current club, then structured changes — one variable at a time where possible — starting with weight, then flex, then profile. The fitter isn't hunting for one heroic shot; they're looking for the shaft that produces the tightest cluster of good results across a full set of swings, including your mishits.",
    },

    {
      type: "heading",
      level: 2,
      text: "The flex chart myth",
    },
    {
      type: "paragraph",
      text: "Every golfer has seen a chart mapping driver swing speed to shaft flex. Those charts exist because they're better than guessing — and fitters distrust them because swing speed is only one of the inputs that determine how a shaft loads. Tempo, transition (how aggressively you start the downswing), and release point all change the load a shaft sees. A smooth 100 mph swinger and an abrupt, late-hitting 100 mph swinger can need meaningfully different shafts.",
    },
    {
      type: "table",
      caption: "Common flex-to-driver-swing-speed ranges. Treat this as a starting point for testing, not a fitting answer — tempo and transition move golfers up or down a flex from these bands.",
      headers: ["Flex", "Typical driver swing speed", "Typical driver carry ballpark"],
      rows: [
        ["Ladies (L)", "Under 70 mph", "Under 180 yards"],
        ["Senior (A)", "70–80 mph", "180–200 yards"],
        ["Regular (R)", "80–95 mph", "200–240 yards"],
        ["Stiff (S)", "95–110 mph", "240–275 yards"],
        ["Extra Stiff (X)", "Over 110 mph", "Over 275 yards"],
      ],
    },
    {
      type: "paragraph",
      text: [
        "Two more reasons the chart can't be the whole answer. First, flex isn't standardized across manufacturers, so \"stiff\" is a label, not a measurement. Second, the chart says nothing about weight, which is often the variable that actually fixes a golfer's pattern. If you want a quick pre-fitting estimate of where to start, our free ",
        { text: "shaft flex calculator", href: "/tools/golf-shaft-flex-calculator" },
        " uses your swing speed or carry distance to place you in a starting band — then a dynamic fitting confirms or corrects it.",
      ],
    },
    {
      type: "callout",
      title: "Static vs. dynamic fitting",
      text: "Picking flex from a chart is a static fitting: it uses one number about you. A dynamic fitting has you actually hit balls with candidate shafts while a launch monitor measures the result. Every serious fitter works dynamically, because the chart can't see your tempo, your transition, or your strike pattern — and those are what the shaft has to match.",
    },

    {
      type: "heading",
      level: 2,
      text: "Shaft-only refits: upgrading clubs you already own",
    },
    {
      type: "paragraph",
      text: "You don't need to buy new clubs to fix a shaft problem. Reshafting — pulling the existing shaft and installing a better-matched one in the same head — is routine work at independent fitting shops and club repair benches. It's the highest-value move when your clubheads are recent and the shaft is the mismatch: a driver bought off the rack with the stock shaft, irons inherited or bought used, or a swing that has changed speed since the clubs were bought.",
    },
    {
      type: "list",
      items: [
        "Driver reshaft: aftermarket driver shafts range from roughly $75 for solid mid-tier options to $200–$500+ for premium models, plus a modest installation fee (often $20–$40 with a new grip). Many modern drivers use adapter sleeves, so a fitted shaft can be swapped in without epoxy work at all.",
        "Iron reshafts: stock steel shafts run roughly $10–$40 per club plus installation; premium steel and graphite iron shafts cost more. Reshafting a full iron set approaches the cost of new mid-range irons, so fitters usually reserve it for recent, well-liked heads.",
        "The fitting itself: many shops offer a shaft-focused fitting for a single club (most commonly driver) at $50–$100, often credited toward the shaft purchase. A full-bag shaft evaluation costs more but is rarely the right first step — start with the club that's costing you the most strokes.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "One warning on buying shafts without a fitting: aftermarket shafts have thriving resale markets precisely because golfers buy them on reputation and reviews rather than data. A shaft that transformed someone else's driver was fitted to their delivery, not yours. The used-shaft roulette wheel is one of the most expensive habits in golf — a ",
        { text: "driver fitting", href: "/guides/driver-fitting" },
        " that identifies the right shaft once is cheaper than three wrong guesses.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Is a shaft fitting worth it?",
    },
    {
      type: "paragraph",
      text: "The honest answer depends on how repeatable your swing is and how consistent your miss is:",
    },
    {
      type: "list",
      items: [
        "Worth it: your contact is reasonably repeatable and you have a persistent pattern — consistently low launch, ballooning spin, a one-way miss, or distances that don't match your speed. These are exactly the patterns a shaft change can move.",
        "Worth it: you bought clubs off the rack with stock shafts and have never been measured. Stock shafts are built for the middle of the market; if your speed or tempo sits outside that middle, the stock shaft is a guess that happens to be installed.",
        "Worth it: your swing speed has changed — faster from lessons and training, or slower with age — and your clubs were fitted (or bought) for the old speed.",
        "Wait: your contact and miss pattern change from swing to swing. A fitter can't optimize a delivery that isn't repeatable yet; lessons first, then a fitting once a pattern emerges. Good fitters will tell you this themselves.",
        [
          "Either way, shafts are one variable among several. If you're deciding between a shaft-only session and a fuller fitting, our ",
          { text: "iron fitting guide", href: "/guides/iron-fitting" },
          " explains how shaft, lie angle, length, and loft interact — for irons, lie angle is frequently the bigger fix.",
        ],
      ],
    },

    {
      type: "cta",
      heading: "Get your shafts matched by a professional",
      text: "Browse independent fitting studios and shops across all 50 states — with services, ratings, and contact details for each.",
      buttonLabel: "Find a Fitter Near You",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "What is a golf shaft fitting?",
      answer:
        "A shaft fitting is a session where a fitter tests shafts of different flexes, weights, and profiles in your club while a launch monitor measures ball speed, launch angle, spin rate, and dispersion. The goal is to find the shaft that produces the tightest, most efficient shot pattern for your specific swing — not just your swing speed, but your tempo and transition too. It can be done as part of a full club fitting or as a shaft-only session for clubs you already own.",
    },
    {
      question: "How do I know what shaft flex I need?",
      answer:
        "Swing speed charts give a starting point: roughly, regular flex for 80–95 mph driver swing speeds, stiff for 95–110 mph, extra stiff above that. But flex isn't standardized between manufacturers, and tempo and transition change how a shaft loads, so two golfers at the same speed can need different shafts. Use a chart or flex calculator to pick a starting band, then confirm it with a dynamic fitting where you hit balls and compare launch monitor numbers.",
    },
    {
      question: "Does shaft flex really make a difference?",
      answer:
        "Yes, though weight often matters more. A shaft that's poorly matched to your swing shows up as launch and spin outside the efficient window, a wider dispersion pattern, or an inconsistent strike location on the face. Being one flex label off is usually a modest problem; being significantly off in flex and weight together costs real distance and consistency. The difference is measurable on a launch monitor, which is exactly how a fitting decides.",
    },
    {
      question: "Can I put a new shaft in my existing driver?",
      answer:
        "Yes. Most modern drivers use adapter sleeves, so a new shaft with the right adapter installs without any epoxy work, and any fitting shop can build one for you. Aftermarket driver shafts range from roughly $75 for solid mid-tier options to $200–$500+ for premium models, plus a small installation fee. A shaft-only driver fitting to identify the right one typically costs $50–$100 and is often credited toward the purchase.",
    },
    {
      question: "Steel or graphite shafts — which should I play?",
      answer:
        "In drivers and fairway woods, graphite is universal. In irons, steel remains the default for golfers with moderate-to-fast swing speeds who value consistency and feedback, while graphite suits golfers who need the lighter weight to maintain clubhead speed — commonly seniors, slower swingers, and players managing joint or back pain. Modern graphite iron shafts have closed much of the old consistency gap, so the choice today is about weight and feel, and a fitting settles it with data.",
    },
  ],
  related: [
    { label: "Kick Point in Golf Shafts, Explained", href: "/guides/kick-point" },
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
    { label: "Driver Fitting: What Happens and Is It Worth It?", href: "/guides/driver-fitting" },
    { label: "Iron Fitting: What Happens and Is It Worth It?", href: "/guides/iron-fitting" },
  ],
}
