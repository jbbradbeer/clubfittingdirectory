import type { Guide } from "@/lib/guides/types"

export const swingWeightGuide: Guide = {
  slug: "swing-weight",
  metaTitle: "Swing Weight in Golf: What D2 Actually Means (2026)",
  metaDescription:
    "Swing weight explained: what the A0–G0 scale measures, why it's not total weight, how grip and shaft changes shift it, and how fitters use it to build a consistent set.",
  targetKeyword: "swing weight golf",
  eyebrow: "Fitting Glossary",
  h1: "Swing Weight: What It Is and Why Fitters Care About It",
  excerpt:
    "Swing weight measures how heavy a club feels when you swing it — not how much it weighs on a scale. Here's how the A0–G0 scale works, what shifts it, and why matching it across a set matters more than the number itself.",
  keyTakeaways: [
    "Swing weight measures how a club's weight is distributed — how head-heavy it feels during the swing — not the club's total weight on a scale.",
    "It's expressed on a letter-number scale (A0 to G0) measured on a 14-inch fulcrum balance; most men's stock irons fall around D0–D2 and most women's around C5–C7, though these are conventions, not prescriptions.",
    "Small component changes move swing weight in predictable ways: roughly 2 grams in the head, 4–5 grams in the grip, or 9 grams in the shaft each shift it about one point.",
    "Consistency across a set matters more than hitting any specific number — if your 7-iron feels different from your 8-iron, your tempo and strike quality suffer.",
    "Fitters use swing weight as a feel-matching tool: they find the weight distribution that produces your best strike pattern, then build every club to deliver that same feel.",
  ],
  readMinutes: 6,
  datePublished: "2026-07-29",
  dateModified: "2026-07-29",
  blocks: [
    {
      type: "paragraph",
      text: "Swing weight is one of the most misunderstood terms in club fitting. Golfers hear \"D2\" and assume it describes how heavy a club is. It doesn't. Two clubs can weigh exactly the same on a scale and feel completely different in your hands — because swing weight measures where the weight sits, not how much of it there is.",
    },

    {
      type: "heading",
      level: 2,
      text: "What swing weight actually measures",
    },
    {
      type: "paragraph",
      text: "Swing weight describes how head-heavy a club feels when you swing it. It's measured on a swing weight scale: the club is placed on a balance with a fulcrum 14 inches from the butt end of the grip, and the reading reflects how much the head side outweighs the grip side. More weight toward the head means a higher swing weight; more weight toward the grip means a lower one.",
    },
    {
      type: "paragraph",
      text: "The result is expressed as a letter and a number — A0 at the lightest-feeling end of the scale through G0 at the heaviest. Each letter spans ten numbered increments (C8, C9, D0, D1, D2...), and each single increment is called a swing weight point. Most golfers can't feel a one-point difference; a two- to three-point difference is where most players start to notice.",
    },
    {
      type: "callout",
      title: "Swing weight is not total weight",
      text: "Total weight (or static weight) is what the whole club weighs on a scale — typically 350–450 grams for an iron. Swing weight is the balance of that weight around the 14-inch fulcrum. A club builder can add weight to the grip end and make a club heavier overall while making its swing weight lower. The two specs are related but independent, and a good fitting considers both.",
    },

    {
      type: "heading",
      level: 2,
      text: "The scale, from A0 to G0",
    },
    {
      type: "table",
      caption: "The swing weight scale and how each range typically feels.",
      headers: ["Range", "Typical use", "How it feels"],
      rows: [
        ["A0–B9", "Rare; some junior and ultralight senior builds", "Very light head feel; easy to swing fast, hard to sense the clubhead"],
        ["C0–C7", "Many women's and senior stock builds", "Light head feel; favors players with slower tempo or less strength"],
        ["C8–D0", "Lightweight men's builds, some ladies' plus builds", "Balanced-to-light; common with lighter graphite shafts"],
        ["D0–D2", "The most common men's stock iron and driver range", "The conventional 'standard' head feel most club builds target"],
        ["D3–D5", "Stronger players, many wedge builds", "Noticeably head-heavy; wedges often run here on purpose for feel around the greens"],
        ["D6–G0", "Tour builds at the low end; training clubs beyond", "Very head-heavy; rarely used in playable sets past the D8 area"],
      ],
    },
    {
      type: "paragraph",
      text: "Treat these ranges as conventions, not rules. D0–D2 became the men's standard largely because that's what manufacturers settled on for stock builds — not because it's optimal for every golfer. Plenty of good players game C8 irons; plenty game D4. What matters is whether the feel matches your tempo and produces consistent strikes.",
    },

    {
      type: "heading",
      level: 2,
      text: "What moves swing weight: the rules of thumb",
    },
    {
      type: "paragraph",
      text: "Every component change shifts swing weight in a predictable direction, and fitters carry a set of approximations for how much. These are rules of thumb, not exact physics — the real number depends on where along the club the weight changes — but they're accurate enough that builders use them every day:",
    },
    {
      type: "list",
      items: [
        "About 2 grams in the head ≈ 1 swing weight point. Head weight sits farthest from the fulcrum, so small changes there have the biggest effect. This is why lead tape and adjustable head weights are the standard tools for fine-tuning.",
        "About 4–5 grams in the grip ≈ 1 point, in the opposite direction. A heavier grip moves weight to the butt end, which lowers swing weight. Switching from a 50-gram grip to a 62-gram midsize grip drops swing weight roughly 2–3 points — a common surprise for golfers who regrip without rechecking.",
        "About 9 grams in the shaft ≈ 1 point. Shaft weight is spread along the club's length, so it takes a larger change to move the balance. Dropping from a 120-gram steel shaft to an 85-gram graphite shaft changes both total weight and swing weight meaningfully — which is why a shaft change is never just a shaft change.",
        "Length changes matter most of all: adding half an inch of length raises swing weight by roughly 3 points, because it moves the head farther from the fulcrum. Cutting a club down does the reverse — a big reason cut-down clubs often feel dead.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "This is why fitters recheck swing weight after any spec change. If a fitting settles on a longer club or a lighter shaft, the builder compensates — usually with head weight — so the finished club still feels the way it did when you hit it best. Our ",
        { text: "iron fitting guide", href: "/guides/iron-fitting" },
        " covers how shaft, length, and lie decisions interact during a session.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Why consistency across the set matters",
    },
    {
      type: "paragraph",
      text: "The practical value of swing weight isn't finding a magic number — it's making every club in the bag feel the same. Iron sets are traditionally built to a single swing weight (say, D1 across all of them), so the head weights increase as the clubs get shorter. When one club in the set is off, your tempo adjusts to it without you realizing, and that club becomes the one you can never quite trust.",
    },
    {
      type: "paragraph",
      text: "This is also why piecemeal changes cause problems. Regrip only your 7-iron with a heavier grip, add lead tape to one wedge, or replace a single shaft after a break, and that club now swings differently from its neighbors. A quick trip across a swing weight scale — most repair shops will check a full set in minutes — restores the match.",
    },

    {
      type: "heading",
      level: 2,
      text: "Counterbalancing: moving weight the other way",
    },
    {
      type: "paragraph",
      text: "Counterbalancing means adding weight to the butt end of the club — through a heavier grip, a butt weight plug, or a counterbalanced shaft — to lower swing weight while raising total weight. It's most common in putters and drivers. The logic: some players deliver the club more consistently with more total mass, but a heavy head feel wrecks their tempo. Counterbalancing gives them the mass without the head-heaviness. It's a legitimate fitting tool, not a gimmick, but it's a feel preference that should be tested with launch monitor data rather than assumed.",
    },

    {
      type: "heading",
      level: 2,
      text: "How fitters actually use swing weight",
    },
    {
      type: "paragraph",
      text: [
        "In a fitting, swing weight is a dependent variable, not a starting point. The fitter first finds the head, shaft, and length that produce your best launch numbers and strike pattern — the process described in our ",
        { text: "complete club fitting guide", href: "/guides/golf-club-fitting" },
        " — and then records the swing weight of the build you hit best. That number becomes the feel target for the finished clubs. Some fitters will also experiment directly, adding lead tape in two-gram increments to see whether a heavier or lighter head feel tightens your dispersion.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Swing weight matters most in the scoring clubs, where tempo and feel dominate — but it shows up in ",
        { text: "driver fitting", href: "/guides/driver-fitting" },
        " too, because modern adjustable drivers let fitters move head weight around in seconds. If your driver ever felt wrong after adding a heavier aftermarket grip, swing weight is almost certainly why.",
      ],
    },

    {
      type: "paragraph",
      text: [
        "Swing weight matching is the traditional approach, but it isn't the only one — some fitters and builders match clubs by whole-club MOI instead, which accounts for length differences that swing weight ignores. Our ",
        { text: "guide to MOI in golf clubs", href: "/guides/golf-club-moi" },
        " explains the difference and who benefits from each.",
      ],
    },

    {
      type: "cta",
      heading: "Get your set checked and matched",
      text: "A fitter can measure your full set on a swing weight scale in minutes and tell you whether your clubs actually match. Browse fitting studios and repair shops across all 50 states.",
      buttonLabel: "Find a Fitter Near You",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "What is swing weight in golf?",
      answer:
        "Swing weight is a measurement of how head-heavy a golf club feels when you swing it. It's measured on a balance with a fulcrum 14 inches from the grip end and expressed on a letter-number scale from A0 (lightest feel) to G0 (heaviest feel). It is not the club's total weight — two clubs can weigh the same on a scale and have very different swing weights depending on where the weight is distributed.",
    },
    {
      question: "What is a normal swing weight for irons?",
      answer:
        "Most men's stock irons are built between D0 and D2, and most women's stock irons between C5 and C7. Wedges often run a few points heavier (D3–D5) for added feel. These are manufacturing conventions rather than rules — the right swing weight for you is the one that matches your tempo and produces your most consistent strikes, which a fitting determines directly.",
    },
    {
      question: "How much does one swing weight point change feel?",
      answer:
        "One point is a subtle change most golfers can't consciously feel — roughly 2 grams of head weight. A two- to three-point change is where most players notice a difference in head feel and tempo. As reference points: about 2 grams added to the head, 4–5 grams removed from the grip, or 9 grams added to the shaft each raise swing weight by roughly one point, and half an inch of added length raises it by about three points.",
    },
    {
      question: "Does regripping change swing weight?",
      answer:
        "Yes. Grip weight sits on the opposite side of the fulcrum from the head, so a heavier grip lowers swing weight and a lighter grip raises it — roughly one point per 4–5 grams of grip weight change. Switching from a standard to a midsize or oversize grip commonly drops swing weight 2–3 points, which is why clubs can feel noticeably different after a regrip. A shop can restore the original feel by adding head weight.",
    },
    {
      question: "What is counterbalancing in golf clubs?",
      answer:
        "Counterbalancing adds weight to the butt end of the club — via a heavier grip, a butt weight, or a counterbalanced shaft — to lower swing weight while increasing total weight. It suits players who deliver the club more consistently with more overall mass but who lose tempo when the head feels heavy. It's most common in putters and drivers, and it's worth testing with launch monitor data during a fitting rather than adopting on feel alone.",
    },
  ],
  related: [
    { label: "MOI in Golf Clubs: Forgiveness and MOI Matching Explained", href: "/guides/golf-club-moi" },
    { label: "Iron Fitting: What Happens and Is It Worth It?", href: "/guides/iron-fitting" },
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
    { label: "Driver Fitting: What Happens and Is It Worth It?", href: "/guides/driver-fitting" },
  ],
}
