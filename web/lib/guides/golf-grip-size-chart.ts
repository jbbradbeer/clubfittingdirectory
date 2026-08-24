import type { Guide } from "@/lib/guides/types"

export const golfGripSizeChartGuide: Guide = {
  slug: "golf-grip-size-chart",
  metaTitle: "Golf Grip Size Chart: Hand Measurement + Diameter Tables (2026)",
  metaDescription:
    "The complete golf grip size chart — hand length table, glove size guide, exact diameter specs, tape wrap counts, and ladies'/junior sizing. Find your size in 60 seconds.",
  targetKeyword: "golf grip size chart",
  h1: "Golf Grip Size Chart: Find Your Size in 60 Seconds",
  excerpt:
    "Two hand measurements, one chart. Whether you're buying new grips or heading into a fitting, here's the complete grip size reference — from hand length and glove size to exact diameter specs and how many tape wraps it takes to go up a size.",
  keyTakeaways: [
    "Your grip size starts with two measurements of your glove hand: wrist-crease to middle-fingertip (hand length) and middle-finger length — together they place you in undersize, standard, midsize, or jumbo.",
    "Glove size is a rough proxy, but two golfers wearing the same medium glove can have hands nearly 3/4 inch apart in length — enough to put one in midsize territory — so always measure first.",
    "Between stock sizes, builders fine-tune with tape wraps under the grip: each layer adds about 1/64 inch of diameter, so 'standard plus two wraps' is a real, common spec that lands between standard and midsize.",
    "Standard men's grips measure 0.900 inches in diameter at 2 inches below the butt cap; midsize adds roughly 1/16 inch, jumbo adds roughly 1/8 inch.",
    "A dynamic fitting — testing each size on a launch monitor and watching ball flight — gives you the final confirmation, because the size-to-shot-shape effect varies from golfer to golfer more than any chart implies.",
  ],
  readMinutes: 5,
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  blocks: [
    {
      type: "paragraph",
      text: [
        "The grip is the only part of the club you touch, and its size is set by your hand measurements, not by whatever came on the rack at the shop. This page is a single reference for every chart you need: hand length, glove size, diameter specs, and tape wraps. For the deeper explanation of how grip size affects ball flight and when to re-grip, see our ",
        { text: "golf grip size guide", href: "/guides/golf-grip-size" },
        ". And if you'd rather enter your measurements and get a number instantly, the ",
        { text: "free grip size calculator", href: "/tools/golf-grip-size-calculator" },
        " does it in seconds.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "How to measure your hand (2 measurements, 60 seconds)",
    },
    {
      type: "paragraph",
      text: "Use a flexible tape measure or a strip of paper and a ruler. Measure your glove hand — left hand for right-handed golfers, right hand for left-handed golfers — with fingers together and palm facing up.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Hand length: from the major crease where your wrist meets your palm, straight to the tip of your middle finger.",
        "Middle-finger length: from the base crease of your middle finger (where the finger meets the palm) to the fingertip.",
      ],
    },
    {
      type: "paragraph",
      text: "Hand length determines your size band. Middle-finger length breaks ties in the overlapping ranges — longer fingers push you toward the larger size within a band, shorter fingers toward the smaller.",
    },

    {
      type: "heading",
      level: 2,
      text: "Golf grip size chart by hand length",
    },
    {
      type: "table",
      caption:
        "Hand length (wrist crease to middle fingertip) → recommended starting grip size.",
      headers: ["Hand length", "Recommended size", "Who this typically fits"],
      rows: [
        [
          "Under 7.0 in (under 17.8 cm)",
          "Undersize / junior",
          "Smaller hands; many women golfers",
        ],
        [
          "7.0 – 8.75 in (17.8 – 22.2 cm)",
          "Standard",
          "Most men and many women",
        ],
        [
          "8.25 – 9.25 in (21.0 – 23.5 cm)",
          "Midsize",
          "Larger hands; high grip-pressure players",
        ],
        [
          "Over 9.25 in (over 23.5 cm)",
          "Jumbo / oversize",
          "Very large hands",
        ],
      ],
    },
    {
      type: "paragraph",
      text: "Notice the overlap between standard (up to 8.75\") and midsize (starts at 8.25\"). That inch of overlap is intentional — if your hand falls there, finger length, grip pressure, and how you hold the club all factor in. This is exactly the territory where a fitter's dynamic testing earns its keep: testing two sizes on a launch monitor takes five minutes and removes the guesswork entirely.",
    },

    {
      type: "heading",
      level: 2,
      text: "Golf grip size chart by glove size",
    },
    {
      type: "paragraph",
      text: "Glove size is a useful shortcut, but use it only as a starting point. Two golfers wearing the same medium glove can have hand lengths nearly 3/4 inch apart — enough to place one solidly in standard and the other at the bottom of midsize territory. Independent testing confirms this spread is real: glove size alone is not a reliable proxy. When in doubt, measure.",
    },
    {
      type: "table",
      caption:
        "Approximate glove size → grip size correlation. Hand measurement is more reliable; use this as a cross-check only.",
      headers: ["Glove size", "Approximate grip size"],
      rows: [
        ["Small (S) / Junior", "Undersize"],
        ["Medium (M)", "Standard"],
        ["Medium-Large (ML)", "Standard to midsize"],
        ["Large (L)", "Midsize"],
        ["Extra Large (XL / XXL)", "Midsize to jumbo"],
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Grip diameter specifications",
    },
    {
      type: "paragraph",
      text: "Grip diameter is measured at a specific point: 2 inches below the top end of the grip (the butt cap). These are the standard industry baseline measurements — individual grip models vary slightly around these numbers, but they're what a club builder uses as the starting reference.",
    },
    {
      type: "table",
      caption:
        "Standard grip diameter specifications measured 2 inches below the butt cap. Men's and ladies' grips use different core sizes.",
      headers: ["Grip size", "Ladies' baseline", "Men's baseline"],
      rows: [
        ["Undersize / junior", "~0.550\"", "~0.560\""],
        ["Standard", "0.850\"", "0.900\""],
        ["Midsize", "—", "~0.960\" (+1/16\" over standard)"],
        ["Jumbo / oversize", "—", "~1.000\"+ (+1/8\" over standard)"],
      ],
    },
    {
      type: "callout",
      title: "Core size vs. grip outer diameter",
      text: "The specs above are for the grip's inner core (the hole that slides over the shaft). The outer diameter you feel in your hand depends on the rubber wall thickness, which varies by grip model. Two standard-core grips from different brands can feel noticeably different — which is why trying a few models in-store is worth the few minutes.",
    },

    {
      type: "heading",
      level: 2,
      text: "Tape wrap chart: how many wraps to go up a size",
    },
    {
      type: "paragraph",
      text: "Club builders add layers of grip tape under the grip to fine-tune size between the stock options. Each wrap of standard grip tape adds roughly 1/64 inch (~0.016\") to the outer diameter. This lets a builder hit an exact diameter that the measurements suggest, rather than rounding to the nearest stock size.",
    },
    {
      type: "table",
      caption:
        "Extra tape wraps added under a standard-core grip, and the resulting diameter increase.",
      headers: ["Extra wraps added", "Approx. diameter increase", "Effective result"],
      rows: [
        ["1 wrap", "+1/64\" (~0.016\")", "Just above standard"],
        ["2 wraps", "+2/64\" (~0.031\")", "Between standard and midsize — a common custom spec"],
        ["3 wraps", "+3/64\" (~0.047\")", "Close to midsize"],
        ["4 wraps", "+4/64\" (~0.063\")", "Near midsize spec"],
        ["~4–5 wraps total", "+1/16\" (~0.063\")", "Midsize equivalent"],
        ["~8–9 wraps total", "+1/8\" (~0.125\")", "Jumbo equivalent"],
      ],
    },
    {
      type: "paragraph",
      text: "A builder can also wrap only under the lower hand to taper the grip — building up the grip size for the right hand position while leaving the butt end at standard. This is a real and common spec for golfers who need more size in the lower-hand area specifically.",
    },

    {
      type: "heading",
      level: 2,
      text: "Ladies' and junior grip sizing",
    },
    {
      type: "paragraph",
      text: "Ladies' grips run narrower in core diameter — 0.850\" vs. 0.900\" for men's standard — reflecting smaller average hand dimensions. Junior grips are sized for smaller hands still, often matching undersize adult specs. The hand-length chart above applies equally to women golfers; the only practical difference is which grip catalogue to shop from, not the measurement method.",
    },
    {
      type: "table",
      caption:
        "Grip sizing for women and juniors — same measurement method, different baseline diameter.",
      headers: ["Category", "Standard core diameter", "Notes"],
      rows: [
        [
          "Junior",
          "~0.500\"–0.560\"",
          "Matched to hand size; undersize adult grips often serve well",
        ],
        [
          "Ladies'",
          "0.850\"",
          "Standard ladies' baseline; midsize ladies' available from most major brands",
        ],
        [
          "Men's standard",
          "0.900\"",
          "Starting point for most men; what most clubs ship with",
        ],
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Which measurement method should you use?",
    },
    {
      type: "paragraph",
      text: "Use all three checks in this order — each one confirms or refines the last:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Hand length measurement — your primary source. Two minutes with a tape measure gives the most reliable starting size.",
        "Glove size cross-check — confirms you're in the right ballpark. If the two methods disagree, trust the tape measure.",
        "The finger-position feel test — with the grip in your glove hand, the tips of your middle and ring fingers should lightly brush the pad of your thumb. If they dig in, the grip may be too small. If there's a clear gap, it may be too big.",
        "Dynamic fitting confirmation — if you can, test two sizes on a launch monitor and watch dispersion. The size that produces tighter, more consistent ball flight is your fitting size, regardless of what the chart says.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Grip size is one spec among many — shaft, lie angle, length, and loft all interact with how the club performs. If you're going in for a full fitting, the grip check is usually part of it. Our guide to ",
        {
          text: "what to expect at a golf club fitting",
          href: "/guides/what-to-expect-at-a-golf-club-fitting",
        },
        " explains how the session flows. If you just want to get your grips replaced and sized at the same time, most independent fitting shops and repair benches can do both in a single visit — and it's one of the highest-value services in golf.",
      ],
    },

    {
      type: "cta",
      heading: "Get your grips sized by a fitting professional",
      text: "Most fitting shops and repair benches size and install new grips the same day. Browse 1,268 shops across all 50 states.",
      buttonLabel: "Find a Fitter Near You",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "How do I read a golf grip size chart?",
      answer:
        "Measure your glove hand from the wrist crease to the tip of your middle finger. Under 7 inches points to undersize, 7–8.75 inches to standard, 8.25–9.25 inches to midsize (the bands overlap — finger length breaks ties here), and over 9.25 inches to jumbo. The chart gives you a starting size; a feel test and, ideally, a dynamic fitting with a launch monitor confirm it.",
    },
    {
      question: "What is the standard golf grip size?",
      answer:
        "Men's standard grips measure 0.900 inches in outer diameter at 2 inches below the butt cap — this is the industry baseline. Ladies' standard is 0.850 inches. Midsize is roughly 1/16 inch larger than men's standard, and jumbo is roughly 1/8 inch larger. Most off-the-shelf clubs ship with men's standard grips regardless of the buyer's hand size.",
    },
    {
      question: "What golf grip size do I need with a medium glove?",
      answer:
        "A medium glove generally corresponds to standard grip size, but two golfers wearing medium gloves can have hand lengths nearly 3/4 inch apart — enough for one to need midsize. Always confirm with a hand-length measurement. If your hand length is 7–8 inches, standard is right; if you're at 8.25–8.75 inches, you may be in the standard-to-midsize overlap where testing both sizes on a club is worth the few minutes.",
    },
    {
      question: "How many tape wraps does it take to go from standard to midsize grip?",
      answer:
        "Midsize is roughly 1/16 inch larger than standard in diameter. Each tape wrap under the grip adds about 1/64 inch, so you need approximately four wraps to reach midsize equivalent from a standard-core grip. Builders often use just one to three wraps for custom sizes between standard and midsize — 'standard plus two wraps' is a commonly fitted spec.",
    },
    {
      question: "Can I get fitted for grip size at the same visit as a club fitting?",
      answer:
        "Yes — grip size is typically part of a full fitting session. If you're getting new irons or a full set built, the builder will size your grips before assembly. If you're happy with your clubs and just want the grips changed, most fitting shops and repair benches will re-grip to a new size as a stand-alone service, often in the same day.",
    },
  ],
  related: [
    {
      label: "Golf Grip Size: How to Measure and Why It Matters",
      href: "/guides/golf-grip-size",
    },
    {
      label: "Golf Club Fitting: The Complete Guide",
      href: "/guides/golf-club-fitting",
    },
    {
      label: "Golf Club Repair Cost Guide",
      href: "/guides/golf-club-repair-cost",
    },
    {
      label: "Shaft Fitting: What It Is and Why It Matters",
      href: "/guides/shaft-fitting",
    },
  ],
}
