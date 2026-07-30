import type { Guide } from "@/lib/guides/types"

export const golfClubLoftGuide: Guide = {
  slug: "golf-club-loft",
  metaTitle: "Golf Club Loft Explained: Ranges by Club & Loft Creep (2026)",
  metaDescription:
    "Golf club loft explained: typical loft ranges from driver to lob wedge, why modern lofts keep getting stronger, loft vs distance and launch, and how a fitting fixes gapping.",
  targetKeyword: "golf club loft",
  eyebrow: "Fitting Glossary",
  h1: "Golf Club Loft: Ranges, Gapping, and Loft Creep",
  excerpt:
    "Loft is the angle of the club face relative to the shaft — the number that most directly controls how high, how far, and with how much spin the ball flies. Here's what the typical ranges are, why modern lofts keep getting stronger, and why gapping matters more than any single number.",
  keyTakeaways: [
    "Loft is the angle between the club face and the shaft's vertical plane — more loft launches the ball higher with more spin and less distance; less loft does the opposite.",
    "Typical lofts run from about 9–12° on a driver to 58–60° on a lob wedge, but there is no industry standard — one brand's 7-iron can carry another brand's 6-iron loft.",
    "Loft creep is real: many modern game-improvement 7-irons sit at 28–30°, roughly what a 6-iron (or even a 5-iron) measured a generation ago — so comparing clubs by the number on the sole is misleading.",
    "The most common loft problem isn't any single club — it's gapping: strong iron lofts squeeze a 25–30-yard hole between the pitching wedge and sand wedge, leaving one or more 'wasted clubs' elsewhere in the set.",
    "A fitting measures your actual lofts and carry distances, then bends irons and wedges (usually 1–2°) or adjusts gap wedges so every club covers a distinct yardage band.",
  ],
  readMinutes: 6,
  datePublished: "2026-07-29",
  dateModified: "2026-07-29",
  blocks: [
    {
      type: "paragraph",
      text: "Loft is the angle of the club face measured from vertical when the shaft is held straight up and down. It's the single biggest reason a sand wedge flies high and short while a driver flies low and long. Every degree of loft changes launch angle, spin rate, and carry distance — which makes loft both the main lever behind how far each club goes and the main variable a fitter adjusts to make a set of clubs work together.",
    },

    {
      type: "heading",
      level: 2,
      text: "Typical loft ranges by club",
    },
    {
      type: "paragraph",
      text: "There is no industry standard for lofts — every manufacturer chooses their own, and they've been drifting stronger for decades. The ranges below cover what you'll find on current equipment:",
    },
    {
      type: "table",
      caption: "Typical loft ranges on modern clubs. Individual models vary — always check the actual spec.",
      headers: ["Club", "Typical loft range"],
      rows: [
        ["Driver", "9–12°"],
        ["3-wood", "13–16°"],
        ["5-wood", "17–19°"],
        ["Hybrid (3H–4H)", "19–24°"],
        ["4-iron", "20–24°"],
        ["5-iron", "23–27°"],
        ["6-iron", "26–30°"],
        ["7-iron", "28–34°"],
        ["8-iron", "32–38°"],
        ["9-iron", "37–42°"],
        ["Pitching wedge", "42–46°"],
        ["Gap wedge", "48–52°"],
        ["Sand wedge", "54–56°"],
        ["Lob wedge", "58–60°"],
      ],
    },
    {
      type: "callout",
      title: "Loft creep: today's 7-iron is yesterday's 6-iron",
      text: "Iron lofts have strengthened steadily for decades. A 7-iron from the 1990s typically measured around 34–35°; many modern game-improvement 7-irons sit at 28–30° — a loft that would have been stamped '6' or even '5' a generation ago. That's a big part of why new irons 'go farther': some of the gain is technology, but a meaningful chunk is simply that the number on the sole changed. When comparing sets, compare lofts, not iron numbers.",
    },

    {
      type: "heading",
      level: 2,
      text: "How loft controls distance, launch, and spin",
    },
    {
      type: "paragraph",
      text: "More loft means a higher launch angle, more backspin, and a steeper descent — the ball flies higher, carries shorter, and stops faster. Less loft launches lower with less spin and more roll. But the relationship isn't linear, and less loft is not automatically more distance: every golfer has an optimal launch-and-spin window for their ball speed. A slower swinger often carries a 10.5° or 12° driver farther than a 9° one, because the extra loft keeps the ball in the air long enough to use the speed they have.",
    },
    {
      type: "paragraph",
      text: [
        "The same logic runs through the irons: strong lofts only help if you generate enough speed to launch them. If a strong-lofted 4- or 5-iron flies low and lands like a line drive, a hybrid with the same loft will usually outperform it. To see how loft translates into expected carry at your swing speed, try our ",
        { text: "golf club distance calculator", href: "/tools/golf-club-distance-calculator" },
        ".",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Strong vs. weak lofts",
    },
    {
      type: "paragraph",
      text: "'Strong' means less loft than traditional for that club number; 'weak' means more. Game-improvement irons run strong (a 28–30° 7-iron) and pair it with low centers of gravity so the ball still launches. Players irons stay closer to traditional lofts (33–35° for a 7-iron), prioritizing trajectory control, spin, and consistent stopping power over raw distance. Neither is better in the abstract — what matters is whether the loft produces a flight you can control and a set that gaps properly.",
    },

    {
      type: "heading",
      level: 2,
      text: "Loft gapping: the wasted-club problem",
    },
    {
      type: "paragraph",
      text: "A well-built set covers your yardage range in roughly even 10–15-yard steps, usually built on 3–5° loft gaps between clubs. When gapping breaks, one of two things happens: two clubs carry the same distance (a wasted slot in a 14-club bag), or a hole opens up and you're stuck between clubs on approach shots.",
    },
    {
      type: "paragraph",
      text: [
        "The most common break point is at the bottom of the set. A modern 42–44° pitching wedge next to a traditional 54–56° sand wedge leaves a 10–12° loft hole — roughly 25–30 yards of yardage with nothing in it. That's exactly the gap a gap wedge exists to fill, and why a fitter checks wedge lofts against your actual pitching wedge rather than assuming a standard. Gapping across the whole set is a core part of an ",
        { text: "iron fitting", href: "/guides/iron-fitting" },
        ", and it's often the adjustment golfers feel most on the course.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Adjustable driver lofts",
    },
    {
      type: "paragraph",
      text: "Most modern drivers have an adjustable hosel that changes stated loft by roughly ±1.5–2°. Two things are worth knowing. First, the mechanism works by rotating the shaft's orientation in the head, so changing loft also slightly changes the face angle at address — adding loft tends to close the face, reducing loft tends to open it. Second, the adjustment range is small; it fine-tunes launch, it doesn't turn a 9° head into a 12° head. Fitters use the hosel to dial in launch and spin after the right head and shaft are chosen, not as a substitute for choosing them.",
    },

    {
      type: "heading",
      level: 2,
      text: "How a fitting sets your lofts",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Measure actual lofts. Clubs leave the factory with tolerances, and lofts drift with use — a fitter first puts each club on a loft/lie machine to see what you're really playing, which is often a degree or more off spec.",
        "Map your carry distances. On a launch monitor, the fitter records carry for each club to find overlaps and holes in your gapping.",
        "Bend to fix the gaps. Irons and wedges can typically be bent 1–2° stronger or weaker to even out the steps — small bends that shift carry meaningfully without changing how the club plays.",
        "Fill remaining holes. Where bending can't close a gap (usually between pitching wedge and sand wedge), the fitter specifies a gap wedge loft that splits the difference.",
        "Set the driver. Adjustable hosel and shaft choice are used together to put launch and spin in the right window for your ball speed.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "Loft is also inseparable from lie angle — both are set on the same machine, in the same session, and bending one can slightly affect the other. If your miss pattern is directional rather than distance-related, start with our ",
        { text: "guide to lie angle", href: "/guides/lie-angle" },
        ". For the broader picture of how loft fits into a full bag setup, see the ",
        { text: "complete golf club fitting guide", href: "/guides/golf-club-fitting" },
        " and our ",
        { text: "golf club fitting chart", href: "/guides/golf-club-fitting-chart" },
        ".",
      ],
    },

    {
      type: "cta",
      heading: "Get your lofts checked and gapped",
      text: "A loft-and-gapping check takes under an hour at most fitting shops and fixes the wasted-club problem for good.",
      buttonLabel: "Find a Fitter Near You",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "What is loft on a golf club?",
      answer:
        "Loft is the angle of the club face measured from vertical when the shaft is straight up and down. It's the main factor controlling how high the ball launches, how much it spins, and how far it carries. Lofts range from about 9–12° on a driver to 58–60° on a lob wedge — more loft means higher, shorter, higher-spinning shots.",
    },
    {
      question: "What loft is a 7-iron?",
      answer:
        "It depends on the set. Modern game-improvement 7-irons typically measure 28–30°, players irons run 33–35°, and 7-irons from the 1990s measured around 34–35°. There is no industry standard, and lofts have strengthened steadily for decades — today's 7-iron often carries the loft a 6-iron had a generation ago. Always compare sets by measured loft, not the number stamped on the sole.",
    },
    {
      question: "Does less loft mean more distance?",
      answer:
        "Only up to a point. Less loft launches the ball lower with less spin, which adds distance for golfers with enough ball speed to keep the shot airborne. Below that speed, less loft costs carry — which is why many golfers hit a 10.5° or 12° driver farther than a 9° one, and why strong-lofted long irons often underperform a hybrid of the same loft. The right loft is the one that puts your launch and spin in the optimal window for your speed.",
    },
    {
      question: "What is loft gapping?",
      answer:
        "Loft gapping is the spacing of lofts across your set so each club covers a distinct yardage, typically in 10–15-yard steps built on 3–5° loft gaps. Bad gapping means either two clubs carrying the same distance (a wasted club) or a yardage hole with nothing in it — most commonly the 25–30-yard gap between a strong modern pitching wedge and a traditional sand wedge. A fitting measures your carries and bends lofts or adds a gap wedge to fix it.",
    },
    {
      question: "Can iron lofts be adjusted?",
      answer:
        "Yes. Irons and wedges are bent on a loft/lie machine, typically 1–2° stronger or weaker — forged heads bend more readily than cast. Bending usually costs $5–$10 per club, and a full-set loft-and-lie check runs about $75–$150. Adjustable drivers change loft through the hosel instead, usually within ±1.5–2° of the stated loft.",
    },
  ],
  related: [
    { label: "Lie Angle: What It Is and Why It Matters", href: "/guides/lie-angle" },
    { label: "Iron Fitting: What Happens and Is It Worth It?", href: "/guides/iron-fitting" },
    { label: "Golf Club Distance Calculator", href: "/tools/golf-club-distance-calculator" },
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
  ],
}
