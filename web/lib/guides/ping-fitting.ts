import type { Guide } from "@/lib/guides/types"

export const pingFittingGuide: Guide = {
  slug: "ping-fitting",
  metaTitle: "Ping Fitting: Color Code Chart Explained + Where to Get Fitted",
  metaDescription:
    "What Ping's color code system means, how to read the lie angle chart, what a full Ping fitting covers, and where to find an authorized Ping fitter near you.",
  targetKeyword: "ping fitting",
  eyebrow: "Club-by-Club Guides",
  h1: "Ping Fitting: Color Code Chart Explained + Where to Get Fitted",
  excerpt:
    "Ping's color code system is one of the most recognizable ideas in golf fitting — a chart that translates your height and wrist-to-floor measurement into a lie angle recommendation. Here's what it actually means, what a full Ping fitting covers beyond the chart, and where to get fitted.",
  keyTakeaways: [
    "The Ping color code chart is a lie angle recommendation system: it maps your height and wrist-to-floor measurement to one of 12 color codes, each representing a specific lie angle (±1° per step from standard), to give your irons a starting-point fit.",
    "The color code is a starting point — a dynamic fitting with a launch monitor, impact tape, and ball flight data refines the final lie angle from there, and also covers shaft selection, length, and loft/lie adjustments.",
    "Ping authorized fitters — found via the fitter locator at ping.com — can access Ping's full component matrix and build clubs to your color code from the factory, including non-standard configurations not available off-the-shelf.",
    "Many big-box retailers and GOLFTEC locations offer Ping fitting, often at no charge, because Ping subsidizes the fitting session for its retail partners.",
    "If you know your color code and dot, you can apply it when buying used Ping irons — the color dot is stamped on the hosel of Ping irons and indicates the lie angle of that specific club.",
  ],
  readMinutes: 8,
  datePublished: "2026-08-17",
  dateModified: "2026-08-17",
  blocks: [
    {
      type: "paragraph",
      text: "Ping has been fitting golfers with its color code system since 1966 — longer than most fitting systems that are now considered standard. The idea was simple: instead of selling one lie angle to everyone, match each golfer's height and wrist-to-floor measurement to a lie angle that suited their build. The color dot stamped on the hosel of every Ping iron tells you exactly what lie angle that club was built to, so fitting carries across models and even across used club purchases.",
    },
    {
      type: "paragraph",
      text: "Today the color code chart is one of the first things a Ping fitting covers — but it's only the starting point of a full fitting that also includes shaft selection, length, loft/lie verification with impact tape, and a launch monitor for ball flight. Here's how the whole system works.",
    },

    {
      type: "heading",
      level: 2,
      text: "What the Ping color code chart is — and what it isn't",
    },
    {
      type: "paragraph",
      text: "The color code chart maps two body measurements — your height and your wrist-to-floor distance — to a recommended lie angle for Ping irons. The chart has 12 color codes arranged from most upright (Maroon, at the top) to most flat (Gold, at the bottom). Black dot is the standard (0° deviation); each step away from Black is 0.75° of lie angle change.",
    },
    {
      type: "table",
      caption: "Ping color codes and their lie angle relative to standard (Black = 0°).",
      headers: ["Color code", "Lie angle vs. standard", "Description"],
      rows: [
        ["Maroon", "+4.5° upright", "Most upright; very tall or long arms"],
        ["Silver", "+3.75° upright", "Upright"],
        ["White", "+3.0° upright", "Upright"],
        ["Green", "+2.25° upright", "Moderately upright"],
        ["Blue", "+1.5° upright", "Slightly upright"],
        ["Yellow", "+0.75° upright", "Near standard"],
        ["Black", "Standard (0°)", "Standard lie; fits a 5'9\"–5'10\" golfer with average proportions"],
        ["Red", "-0.75° flat", "Slightly flat"],
        ["Orange", "-1.5° flat", "Flat"],
        ["Brown", "-2.25° flat", "Moderately flat"],
        ["Purple (Lie)", "-3.0° flat", "Flat; shorter golfers or longer arms"],
        ["Gold", "-4.5° flat", "Most flat"],
      ],
    },
    {
      type: "paragraph",
      text: "To find your color code using the chart: measure your height (without shoes) and your wrist-to-floor distance (standing with arms hanging naturally, distance from the crease of your wrist to the floor). Find your height along the top of the chart and your wrist-to-floor down the left side — the cell they intersect gives your color code. Ping publishes the chart on their website and most authorized fitters have a printed version.",
    },
    {
      type: "callout",
      title: "The color code is a starting point",
      text: "The chart prediction is a static measurement — it doesn't account for your posture at address, your swing's shaft lean, or how you naturally sole the club at impact. A fitter uses the chart to get close, then verifies with impact tape and ball flight data to confirm the final lie angle. It's common to end up one step different from the chart prediction once the dynamic check is done.",
    },

    {
      type: "heading",
      level: 2,
      text: "What a full Ping fitting covers",
    },
    {
      type: "paragraph",
      text: "A Ping fitting is a standard iron fitting in all the ways that matter — the color code system just gives it a more systematic starting point for lie angle than most other brands offer.",
    },
    {
      type: "list",
      items: [
        "Lie angle via color code chart, then confirmed with impact tape and ball flight on a launch monitor. Impact tape on the sole reveals where the club is contacting the ground at impact — a mark toward the toe indicates the club is too upright; toward the heel indicates too flat.",
        "Club length, adjusted for height and arm length. Ping's standard lengths are based on the color code, but fitters can adjust ±1.5\" from standard.",
        "Shaft selection across steel and graphite options, filtered by swing speed, tempo, and transition. Ping makes its own shaft line (Alta graphite, AWT 2.0 steel) but authorized fitters can also specify aftermarket shafts.",
        "Iron model selection — whether the golfer's swing and ball flight suits a game-improvement model (G430, G-crossover), player-distance model (i230), or players iron (Blueprint series).",
        "Grip size (Ping's standard grips run slightly large; grip size affects wrist rotation and impact position).",
        "Loft/lie final verification once the color code and length are confirmed — fitters can specify exact loft and lie adjustments at the factory level.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Lie angle is one of the most important fitting variables for consistent direction. If you want to understand what lie angle actually is and how it affects ball flight, our ",
        { text: "lie angle fitting guide", href: "/guides/lie-angle" },
        " covers the mechanics in plain language.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Where to get fitted for Ping clubs",
    },
    {
      type: "paragraph",
      text: "Ping operates a tiered network of authorized fitters — from large fitting centers to smaller certified shops — and the fitting experience varies by tier. Here's where to look:",
    },
    {
      type: "list",
      items: [
        "Ping's own fitter locator (ping.com → Fitting → Find a Fitter): the most direct route to a Ping-certified fitting professional. Authorized fitters have access to Ping's full component matrix, including non-standard configurations, and can place factory orders to exact specs.",
        "GOLFTEC: a formal Ping fitting partner. GOLFTEC locations with Ping demo clubs offer a fitting that's similar to an authorized dealer session and is often available at no charge as a Ping promotion. Call ahead to confirm they carry Ping and have current-model demo clubs.",
        "Big-box retailers (Golf Galaxy, PGA TOUR Superstore): carry Ping and offer fittings, though typically only with stock-spec demo clubs. Useful for getting close to a color code recommendation but may not access factory-order specs.",
        "Club Champion and True Spec Golf: independent fitting studios that carry Ping alongside many other brands. They're not official Ping fitting centers, but they can fit you into Ping irons with aftermarket shafts and custom specs. The advantage: genuine multi-brand comparison against the Ping lineup.",
        "Independent fitting shops with Ping certification: many local independent fitters carry Ping and are listed on ping.com's locator. These are often the most cost-effective option and can place factory orders.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "How much does a Ping fitting cost?",
    },
    {
      type: "table",
      caption: "Ping fitting fees by venue type, 2026.",
      headers: ["Venue type", "Typical Ping fitting fee", "Notes"],
      rows: [
        [
          "Ping authorized dealer (local)",
          "Free to $50",
          "Many authorized dealers offer complimentary fittings; fee often applied to purchase",
        ],
        [
          "GOLFTEC (Ping partner fitting)",
          "Free (promotional) to $95",
          "Ping partner promotions run frequently; call ahead to confirm current offer",
        ],
        [
          "Big-box retail (Golf Galaxy, PGA TSS)",
          "$50–$100",
          "Standard iron fitting fee; often waived with iron purchase",
        ],
        [
          "Club Champion / True Spec",
          "$150–$175",
          "Multi-brand iron fitting that includes Ping; fee waived with purchase",
        ],
        [
          "Independent fitter (Ping certified)",
          "$50–$100",
          "Highly variable; fee typically applied to any purchase",
        ],
      ],
    },
    {
      type: "paragraph",
      text: "The \"get fitted there, buy elsewhere\" strategy is well-worn on golf forums and works at authorized dealers: you get a color code recommendation and shaft suggestion, and then shop for used Ping irons matching those specs. The main limitation is that off-the-shelf used clubs may not be in your exact color code — but because Ping stamps the color dot on the hosel, you know exactly what you're buying.",
    },

    {
      type: "heading",
      level: 2,
      text: "Using your color code to buy used Ping irons",
    },
    {
      type: "paragraph",
      text: "Every Ping iron manufactured with a color code has the color dot stamped on the hosel of the club — typically on the rear or lower portion of the hosel, visible with the club in your hands. This means that when buying used Ping irons, you can verify the lie angle of any specific club without needing documentation.",
    },
    {
      type: "paragraph",
      text: "If your color code is Black (standard) or adjacent to it (Yellow, Red), used Ping sets are broadly available in those specs. More upright (Green, Blue) or more flat (Orange, Brown) specs are less common in the used market but do appear. Knowing your color code also tells you whether a used set needs bending — most Ping iron heads can be bent ±2° lie and ±2° loft from current position without risk of cracking, which means a Red-dot set can usually be bent to Black or Yellow specs at a repair shop.",
    },
    {
      type: "paragraph",
      text: [
        "For what club adjustments cost at an independent shop, our ",
        { text: "golf club repair cost guide", href: "/guides/golf-club-repair-cost" },
        " covers loft/lie bending fees alongside regripping and reshafting.",
      ],
    },

    {
      type: "cta",
      heading: "Find a Ping fitter near you",
      text: "Browse fitting studios and independent shops across all 50 states. Many carry Ping and can place factory orders to your color code and shaft specs.",
      buttonLabel: "Search the directory",
      href: "/directory",
    },

    {
      type: "paragraph",
      text: [
        "If you're choosing between a Ping-specific fitting and a multi-brand fitting at an independent studio, our guide to ",
        {
          text: "how to choose a club fitter",
          href: "/guides/how-to-choose-a-club-fitter",
        },
        " covers what to look for — and what to ask before booking.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "For a broader look at where to get fitted and what to expect from different venue types, ",
        {
          text: "where to get fitted for golf clubs",
          href: "/guides/where-to-get-fitted-for-golf-clubs",
        },
        " covers the full landscape from big-box to independent boutique.",
      ],
    },
  ],
  faqs: [
    {
      question: "What is the Ping color code system?",
      answer:
        "The Ping color code system is a lie angle fitting tool: it maps your height and wrist-to-floor measurement to one of 12 color codes, each representing a specific lie angle relative to standard. Black dot is standard (0°); each step upright or flat is 0.75° of lie angle change. The color dot is stamped on the hosel of every Ping iron, so you can identify the lie angle of any Ping club — new or used — by looking at the dot. The system was introduced in 1966 and remains unique to Ping.",
    },
    {
      question: "How do I find my Ping color code?",
      answer:
        "Take two measurements: your height without shoes and your wrist-to-floor distance (stand naturally with arms hanging, measure from the crease of your wrist to the floor). Find your height across the top of the Ping color code chart and your wrist-to-floor down the left side — the cell they intersect gives your starting color code. Ping publishes the chart at ping.com. Note that a dynamic fitting with impact tape and launch monitor data often adjusts the static chart prediction by one step, so treat the chart as a starting point.",
    },
    {
      question: "Where can I get fitted for Ping golf clubs?",
      answer:
        "The most reliable route is Ping's own fitter locator at ping.com → Fitting → Find a Fitter. Authorized fitters have access to Ping's full component matrix and can place factory orders to exact specs. GOLFTEC is a Ping fitting partner and often offers complimentary Ping fittings. Big-box retailers (Golf Galaxy, PGA TOUR Superstore) carry Ping and offer fittings but typically only with standard-spec demo clubs. Independent fitting studios like Club Champion and True Spec can also fit you into Ping irons alongside other brands.",
    },
    {
      question: "Is a Ping fitting free?",
      answer:
        "Many authorized Ping dealers offer complimentary fittings, especially for iron fittings that lead toward a purchase. GOLFTEC frequently runs Ping fitting promotions where the session is free. Big-box retailers typically charge $50–$100 but waive the fee with a club purchase. Multi-brand fitters like Club Champion charge $150–$175 for an iron fitting that may include Ping alongside other brands. The total fitting cost at most Ping-authorized locations is $0–$75 if you purchase clubs through them.",
    },
    {
      question: "Can I use my Ping color code to buy used clubs?",
      answer:
        "Yes — the color dot is stamped on the hosel of every Ping iron, so you can verify the lie angle of any used Ping club by looking at the dot. If your color code is Black (standard) or adjacent (Yellow, Red), used sets matching your specs are widely available. If you need an upright or flat code that's harder to find used, most Ping iron heads can be bent ±2° lie from current position at a club repair shop — a Red-dot set can usually reach Black or Yellow specs without issue.",
    },
  ],
  related: [
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
    { label: "How to Choose a Club Fitter", href: "/guides/how-to-choose-a-club-fitter" },
    { label: "Lie Angle: What It Is and Why It Matters", href: "/guides/lie-angle" },
    {
      label: "Where to Get Fitted for Golf Clubs",
      href: "/guides/where-to-get-fitted-for-golf-clubs",
    },
  ],
}
