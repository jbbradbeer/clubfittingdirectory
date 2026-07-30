import type { Guide } from "@/lib/guides/types"

export const lieAngleGuide: Guide = {
  slug: "lie-angle",
  metaTitle: "Lie Angle in Golf: What It Is and Why It Matters (2026)",
  metaDescription:
    "Lie angle explained: static vs dynamic lie, why upright sends shots left and flat sends them right, the lie board test, adjustment costs, and the signs yours is wrong.",
  targetKeyword: "lie angle golf",
  eyebrow: "Fitting Glossary",
  h1: "Lie Angle: What It Is and Why It Matters",
  excerpt:
    "Lie angle is the angle between the club's shaft and the ground when the sole sits flat. When it doesn't match your swing, the face points left or right at impact — a directional miss that no amount of swing work will fix.",
  keyTakeaways: [
    "Lie angle is the angle between the shaft and the ground when the sole of the club rests flat — and when it's wrong for your swing, the face aims left or right of your target at impact even on a perfect strike.",
    "For a right-handed golfer, a lie angle that's too upright sends shots left; too flat sends them right — the opposite applies for left-handers.",
    "Dynamic lie (measured at impact with a lie board and impact tape) is what matters, not static lie — the shaft bows downward during the swing, so many golfers need a different lie angle than a static measurement suggests.",
    "Lie angle matters far more in irons and wedges than in the driver, because more loft converts face misalignment into a bigger directional error.",
    "Most forged irons can be bent 2–4 degrees and most cast irons 1–2 degrees; a lie adjustment typically costs $5–$10 per club at a repair shop.",
  ],
  readMinutes: 6,
  datePublished: "2026-07-29",
  dateModified: "2026-07-29",
  blocks: [
    {
      type: "paragraph",
      text: "Lie angle is the angle formed between the centerline of the shaft and the ground when the club's sole rests flat. A typical 7-iron sits around 62–63 degrees; wedges are more upright, long irons flatter. It sounds like a spec-sheet footnote, but it directly controls where the club face points at impact — which makes it one of the most consequential numbers in a set of irons.",
    },
    {
      type: "paragraph",
      text: [
        "It's also the variable fitters correct most often. In our ",
        { text: "iron fitting guide", href: "/guides/iron-fitting" },
        ", wrong lie angle stands out as the single most common mismatch found in fittings — golfers spend years fighting a pull or a push that turns out to be the club, not the swing.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Static lie vs. dynamic lie",
    },
    {
      type: "paragraph",
      text: "Static lie is the number stamped on the spec sheet — the angle measured with the club soled flat on a bench. Dynamic lie is the angle the club actually presents at the moment of impact, and it's the one that matters. During the downswing the shaft bows downward (droop), your hands may be higher or lower than a neutral setup, and your posture and swing plane all change how the sole meets the turf. Two golfers using the identical club can have very different dynamic lies.",
    },
    {
      type: "paragraph",
      text: "This is why fitting charts based on height and wrist-to-floor measurement are only a starting point. They estimate a static fit; a proper fitting measures what happens when you actually swing.",
    },

    {
      type: "heading",
      level: 2,
      text: "Upright vs. flat: which way the ball goes",
    },
    {
      type: "paragraph",
      text: "When the lie angle is too upright for your swing, the toe of the club sits up at impact and the face effectively aims left of target (for a right-handed golfer). When it's too flat, the heel sits up and the face aims right. The tilted face doesn't just start the ball offline — combined with loft, it imparts sidespin-like tilt to the shot, so the error compounds as the ball flies.",
    },
    {
      type: "paragraph",
      text: "The rule of thumb for right-handers: upright goes left, flat goes right. Left-handers, reverse it. The more loft on the club, the bigger the effect — which is why the same lie error that barely shows up with a 4-iron can put a wedge shot a full green-width offline.",
    },
    {
      type: "table",
      caption:
        "Approximate directional miss from lie angle error on a 150-yard iron shot (right-handed golfer). Actual numbers vary with loft, speed, and strike.",
      headers: ["Lie angle error", "Face effect at impact", "Approximate miss at 150 yards"],
      rows: [
        ["1° too upright", "Face aims slightly left", "~4–5 yards left"],
        ["2° too upright", "Toe up, face left", "~8–10 yards left"],
        ["4° too upright", "Pronounced toe-up", "~15–20 yards left"],
        ["1° too flat", "Face aims slightly right", "~4–5 yards right"],
        ["2° too flat", "Heel up, face right", "~8–10 yards right"],
        ["4° too flat", "Pronounced heel-up", "~15–20 yards right"],
      ],
    },
    {
      type: "callout",
      title: "Why these are approximate",
      text: "The exact miss depends on the club's loft, your ball speed, and where you strike the face — a 2° error on a lofted wedge moves the ball farther offline than the same error on a long iron. Treat the table as a scale of severity, not a lookup table.",
    },

    {
      type: "heading",
      level: 2,
      text: "The lie board test: how fitters measure dynamic lie",
    },
    {
      type: "paragraph",
      text: "The standard test is simple and fast. The fitter puts a strip of impact tape on the sole of the club (or marks the sole with a marker), then has you hit balls off a lie board — a hard, flat plastic board on the ground. Where the sole scuffs the board leaves a mark on the tape:",
    },
    {
      type: "list",
      items: [
        "Mark in the center of the sole: lie angle matches your swing. No change needed.",
        "Mark toward the heel: the heel is digging, meaning the club is too upright for you — it needs to be bent flatter.",
        "Mark toward the toe: the toe is digging, meaning the club is too flat — it needs to be bent more upright.",
      ],
    },
    {
      type: "paragraph",
      text: "Good fitters confirm the lie board result with launch monitor data and your actual shot pattern, because a strike far out on the toe or heel can skew a single reading. A handful of shots gives a reliable picture.",
    },

    {
      type: "heading",
      level: 2,
      text: "Why lie angle matters more in irons than the driver",
    },
    {
      type: "paragraph",
      text: "Loft is the multiplier. The directional error from a tilted lie grows with the club's loft, so a 9-iron or wedge (40°+ of loft) magnifies a lie error far more than a driver (9–11° of loft) does. Drivers are also hit off a tee, not the turf, so the sole never interacts with the ground the way an iron's does. That's why fitters obsess over iron and wedge lie angles and treat driver lie as a minor variable — and why a lie check belongs in every iron fitting.",
    },

    {
      type: "heading",
      level: 2,
      text: "How much can lie angle be adjusted?",
    },
    {
      type: "paragraph",
      text: "Lie angle is changed by bending the hosel in a loft/lie machine. How far a club can safely bend depends on how the head was made:",
    },
    {
      type: "list",
      items: [
        "Forged irons: soft carbon steel bends easily — 2–4° in either direction is routine, and some heads can go further.",
        "Cast irons: harder, more brittle alloys typically allow 1–2° of bend; beyond that the hosel risks cracking. Some modern cast heads bend more than their reputation suggests — a competent repair shop will know the specific model.",
        "Hollow-body and some game-improvement designs: may have limited or no bendability; the fitter will confirm before attempting.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "A lie or loft adjustment typically costs $5–$10 per club, so a full set check-and-bend usually lands in the $75–$150 range. Loft is adjusted on the same machine in the same session, which is also how a fitter fixes distance gapping across a set — see our ",
        { text: "guide to golf club loft", href: "/guides/golf-club-loft" },
        " for how loft and gapping work together.",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "Signs your lie angle is wrong",
    },
    {
      type: "list",
      items: [
        "A consistent directional miss with irons — especially pulls (too upright) or pushes (too flat) for a right-hander — that persists across swing changes and lessons.",
        "Divots that are noticeably deeper on one side: heel-deep divots suggest too upright, toe-deep divots suggest too flat.",
        "Your short irons and wedges miss farther offline than your long irons, in the same direction.",
        "You bought clubs off the rack and you're meaningfully taller or shorter than average, or your wrist-to-floor measurement is unusual for your height.",
        "You bought used clubs — the previous owner may have had them bent to their specs, not yours.",
      ],
    },
    {
      type: "paragraph",
      text: [
        "If several of these sound familiar, a lie check is a quick, inexpensive diagnostic. Static charts like our ",
        { text: "golf club fitting chart", href: "/guides/golf-club-fitting-chart" },
        " can give you a starting estimate from your height and wrist-to-floor measurement, but a dynamic check with a lie board is the only way to know for sure.",
      ],
    },

    {
      type: "cta",
      heading: "Get your lie angles checked",
      text: "A dynamic lie check takes about 30 minutes at most fitting shops. Find one near you with services, ratings, and contact details.",
      buttonLabel: "Find a Fitter Near You",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "What is lie angle in golf?",
      answer:
        "Lie angle is the angle between the club's shaft and the ground when the sole rests flat — typically around 62–63° for a 7-iron. It matters because when the lie angle doesn't match your swing, the toe or heel sits up at impact and the face aims left or right of your target, producing a directional miss even on a well-struck shot.",
    },
    {
      question: "Does an upright lie angle make the ball go left or right?",
      answer:
        "For a right-handed golfer, a lie angle that's too upright makes the ball go left, and one that's too flat makes it go right. This happens because the tilted sole angles the face at impact. Left-handed golfers experience the opposite: too upright goes right, too flat goes left. The effect is larger on higher-lofted clubs like short irons and wedges.",
    },
    {
      question: "How do I know if my lie angle is wrong?",
      answer:
        "The clearest sign is a consistent directional miss with your irons — pulls left (too upright) or pushes right (too flat) for a right-hander — that doesn't respond to swing work. Other signs include divots deeper on the heel or toe side, short irons missing farther offline than long irons, and clubs bought off the rack or used. A lie board test at a fitting shop confirms it in about 30 minutes.",
    },
    {
      question: "How much does it cost to adjust lie angle?",
      answer:
        "A lie angle adjustment typically costs $5–$10 per club at a club repair or fitting shop, and a check-and-adjust across a full iron set usually runs $75–$150. Loft is checked on the same machine in the same session. It's one of the cheapest, highest-impact adjustments in club fitting.",
    },
    {
      question: "Can all irons be bent for lie angle?",
      answer:
        "Most can, within limits. Forged irons (soft carbon steel) bend easily — 2–4° in either direction is routine. Cast irons are harder and typically allow 1–2° before the hosel risks cracking, though some modern cast heads bend more than expected. Some hollow-body designs can't be bent at all. A competent repair shop will know the limits for your specific model.",
    },
  ],
  related: [
    { label: "Golf Club Loft: Ranges, Gapping, and Loft Creep", href: "/guides/golf-club-loft" },
    { label: "Iron Fitting: What Happens and Is It Worth It?", href: "/guides/iron-fitting" },
    { label: "Golf Club Fitting Chart: Height and Wrist-to-Floor", href: "/guides/golf-club-fitting-chart" },
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
  ],
}
