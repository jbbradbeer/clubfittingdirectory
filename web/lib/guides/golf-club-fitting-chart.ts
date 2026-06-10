import type { Guide } from "@/lib/guides/types"

export const golfClubFittingChartGuide: Guide = {
  slug: "golf-club-fitting-chart",
  metaTitle: "Golf Club Fitting Chart: Length, Lie & Shaft Flex",
  metaDescription:
    "Free golf club fitting charts — iron length by height and wrist-to-floor, shaft flex by swing speed and carry distance, and how to read lie angle. Start here.",
  targetKeyword: "golf club fitting chart",
  eyebrow: "Reference Charts",
  h1: "Golf Club Fitting Chart",
  excerpt:
    "Quick-reference charts for length, lie angle, and shaft flex — by height, wrist-to-floor measurement, and swing speed. A starting point before a proper fitting.",
  readMinutes: 7,
  datePublished: "2026-06-03",
  dateModified: "2026-06-03",
  blocks: [
    {
      type: "paragraph",
      text: "A golf club fitting chart gives you a sensible starting point for length, lie angle, and shaft flex based on a few simple measurements. The charts below are the ones fitters use as a baseline — but read the important caveat first.",
    },
    {
      type: "callout",
      title: "Read this first",
      text: "Charts are a starting point, not a final answer. They are based on physical measurements taken while you stand still. They cannot see how you actually deliver the club at impact — which is what truly determines your ideal specs. Use these to understand the ballpark, then confirm with a fitter and a launch monitor.",
    },

    { type: "heading", level: 2, text: "Iron length by height" },
    {
      type: "paragraph",
      text: "Your height is the quickest (if roughest) guide to club length. The chart shows how far to adjust from a standard men's iron length as a starting point.",
    },
    {
      type: "table",
      caption: "Starting-point length adjustment for standard men's irons, by height. Wrist-to-floor (below) is more accurate.",
      headers: ["Height", "Suggested length vs. standard"],
      rows: [
        ["6'9\" – 7'0\"", "+2 inches"],
        ["6'6\" – 6'9\"", "+1.5 inches"],
        ["6'3\" – 6'6\"", "+1 inch"],
        ["6'0\" – 6'3\"", "+0.5 inch"],
        ["5'9\" – 6'0\"", "Standard"],
        ["5'6\" – 5'9\"", "Standard"],
        ["5'3\" – 5'6\"", "-0.5 inch"],
        ["5'0\" – 5'3\"", "-1 inch"],
        ["4'9\" – 5'0\"", "-1.5 inches"],
      ],
    },

    { type: "heading", level: 2, text: "Iron length by wrist-to-floor" },
    {
      type: "paragraph",
      text: "Wrist-to-floor (WTF) is a better predictor of club length than height alone, because it accounts for your arm length and proportions. To measure it: stand up straight in flat shoes on a hard floor, arms hanging naturally at your sides, and measure from the crease of your wrist down to the floor.",
    },
    {
      type: "table",
      caption: "Starting-point length adjustment by wrist-to-floor measurement.",
      headers: ["Wrist-to-floor", "Suggested length vs. standard"],
      rows: [
        ["27\" – 29\"", "-1 inch"],
        ["29\" – 32\"", "-0.5 inch"],
        ["32\" – 34.5\"", "Standard"],
        ["34.5\" – 37\"", "+0.5 inch"],
        ["37\" – 39\"", "+1 inch"],
        ["39\" – 41\"", "+1.5 inches"],
      ],
    },

    { type: "heading", level: 2, text: "Shaft flex by swing speed" },
    {
      type: "paragraph",
      text: "Shaft flex should match how fast you swing. Driver swing speed (or, if you don't know it, your average driver carry distance) is the usual reference. Too stiff and you lose distance and launch; too soft and you lose control.",
    },
    {
      type: "table",
      caption: "Shaft flex by driver swing speed and approximate driver carry distance.",
      headers: ["Driver swing speed", "Driver carry", "Suggested flex"],
      rows: [
        ["Under 75 mph", "Under 180 yds", "Ladies (L)"],
        ["75 – 84 mph", "180 – 200 yds", "Senior / A"],
        ["84 – 96 mph", "200 – 240 yds", "Regular (R)"],
        ["96 – 104 mph", "240 – 260 yds", "Stiff (S)"],
        ["105 mph +", "260 yds +", "Extra Stiff (X)"],
      ],
    },
    {
      type: "callout",
      text: "Flex labels are not standardised across brands — one maker's 'Stiff' can play softer than another's 'Regular'. Shaft weight and profile matter as much as the flex label, which is why trying shafts on a launch monitor beats any chart.",
    },

    { type: "heading", level: 2, text: "How to read lie angle" },
    {
      type: "paragraph",
      text: "Lie angle is the one spec you really shouldn't set from a chart, because it depends entirely on how you deliver the club at impact. The good news is it's easy to check with an impact-tape or board test. Here is how to interpret the result for a right-handed golfer (reverse for left-handed):",
    },
    {
      type: "table",
      caption: "Interpreting a lie-angle (impact board) test for a right-handed golfer.",
      headers: ["What you see", "What it means", "The fix"],
      rows: [
        ["Mark toward the toe / ball pushes right", "Lie is too flat", "Bend more upright"],
        ["Mark in the centre / ball flies straight", "Lie is correct", "No change"],
        ["Mark toward the heel / ball pulls left", "Lie is too upright", "Bend flatter"],
      ],
    },

    { type: "heading", level: 2, text: "Grip size by hand measurement" },
    {
      type: "paragraph",
      text: "Grip size affects how your hands release the club. Measure from the crease of your wrist to the tip of your middle finger as a quick guide.",
    },
    {
      type: "table",
      caption: "Starting-point grip size by hand length (wrist crease to middle-finger tip).",
      headers: ["Hand length", "Suggested grip size"],
      rows: [
        ["Under 7\"", "Undersize"],
        ["7\" – 8.25\"", "Standard"],
        ["8.25\" – 9.25\"", "Midsize"],
        ["Over 9.25\"", "Jumbo / Oversize"],
      ],
    },

    {
      type: "paragraph",
      text: [
        "Want the bigger picture behind these numbers? Read our ",
        { text: "complete guide to golf club fitting", href: "/guides/golf-club-fitting" },
        " for what each spec does and what to expect at a fitting.",
      ],
    },
    {
      type: "cta",
      heading: "Confirm your numbers with a real fitting",
      text: "Charts get you close. A launch monitor gets you fitted. Find a shop near you.",
      buttonLabel: "Find a fitter near you",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "Are golf club fitting charts accurate?",
      answer:
        "Charts are a reliable starting point for length, shaft flex, and grip size, because those relate to physical measurements. They are less reliable for lie angle, which depends on how you deliver the club at impact. Treat charts as a ballpark and confirm with a launch-monitor fitting.",
    },
    {
      question: "How do I measure my wrist-to-floor distance?",
      answer:
        "Stand up straight in flat shoes on a hard floor with your arms hanging naturally at your sides. Measure from the crease of your wrist straight down to the floor. This measurement predicts club length better than height alone.",
    },
    {
      question: "What shaft flex do I need?",
      answer:
        "Match flex to your driver swing speed: roughly Regular for 84–96 mph, Stiff for 96–104 mph, Senior/A below 84 mph, and Extra Stiff above 105 mph. If you don't know your swing speed, use your average driver carry distance as a proxy. Flex labels vary by brand, so testing is best.",
    },
    {
      question: "Can I fit my own clubs using a chart?",
      answer:
        "You can get close on length and grip size, and you can check lie angle with an impact-board test. But shaft selection and fine-tuning really benefit from a launch monitor, so a chart is best used to prepare for a fitting rather than to replace one.",
    },
  ],
  related: [
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
    { label: "Where to Get Fitted for Golf Clubs", href: "/guides/where-to-get-fitted-for-golf-clubs" },
  ],
}
