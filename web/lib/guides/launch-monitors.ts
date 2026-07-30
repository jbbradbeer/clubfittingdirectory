import type { Guide } from "@/lib/guides/types"

export const launchMonitorsGuide: Guide = {
  slug: "launch-monitors",
  metaTitle: "Launch Monitors in Club Fitting: What the Numbers Mean",
  metaDescription:
    "What a launch monitor measures, radar vs. camera systems (TrackMan, GCQuad), the numbers that matter in a fitting, and what to ask your fitter about their setup.",
  targetKeyword: "golf launch monitor fitting",
  eyebrow: "Fitting Glossary",
  h1: "Launch Monitors: What They Measure and Why Fittings Depend on Them",
  excerpt:
    "A launch monitor measures what actually happens at impact — ball speed, launch angle, spin rate, carry — and it's the reason a modern fitting is a data exercise rather than a guessing game. Here's how the two technologies work and which numbers matter.",
  keyTakeaways: [
    "A launch monitor measures the club and ball at impact — ball speed, club speed, smash factor, launch angle, spin rate, spin axis, and carry distance — turning a fitting from opinion into measurement.",
    "The two technologies are radar (Doppler systems like TrackMan and FlightScope, which track the ball's actual flight and are strongest outdoors) and camera (photometric systems like the Foresight GCQuad and GC3, which photograph impact and are strongest indoors).",
    "In a driver fitting, the numbers that matter most are smash factor (impact efficiency), launch angle, and spin rate — the launch-and-spin combination is where most distance is found or lost.",
    "Launch monitor data beats eyeballing because ball flight lies: two shots can look identical to the eye while differing by hundreds of rpm of spin — the difference between a club that works and one that doesn't.",
    "Any serious fitting shop uses a professional launch monitor — ask which system a shop runs before you book; the directory lists each shop's launch monitor brands where published.",
  ],
  readMinutes: 7,
  datePublished: "2026-07-29",
  dateModified: "2026-07-29",
  blocks: [
    {
      type: "paragraph",
      text: "A launch monitor is the instrument at the center of every modern club fitting. It measures what the club and ball are doing at the moment of impact and in the fractions of a second afterward — the data a fitter uses to prove, shot by shot, whether one shaft, head, or loft setting actually outperforms another. Before launch monitors, fitting meant watching ball flight and trusting an experienced eye. Now it means numbers.",
    },
    {
      type: "paragraph",
      text: [
        "If you're preparing for a session, this article explains what the machine is telling your fitter. For the session itself — what to bring and how it unfolds — see our guide to ",
        {
          text: "what to expect at a golf club fitting",
          href: "/guides/what-to-expect-at-a-golf-club-fitting",
        },
        ".",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "What a launch monitor measures",
    },
    {
      type: "paragraph",
      text: "Every professional launch monitor reports two families of data: club data (what the clubhead was doing at impact) and ball data (what the ball did as a result). The core metrics you'll see on the screen during a fitting:",
    },
    {
      type: "table",
      caption: "The key launch monitor metrics and what each one tells your fitter.",
      headers: ["Metric", "What it is", "What it tells you"],
      rows: [
        ["Ball speed", "Speed of the ball just after impact (mph)", "The single biggest driver of distance — raw output of the strike"],
        ["Club speed", "Speed of the clubhead at impact (mph)", "Your swing's input; used to match shaft flex and weight"],
        ["Smash factor", "Ball speed ÷ club speed", "Impact efficiency — how much of your speed becomes ball speed"],
        ["Launch angle", "Vertical angle the ball leaves at (degrees)", "Whether the club's loft and delivery suit your speed"],
        ["Spin rate", "Backspin on the ball (rpm)", "Too much balloons shots; too little drops them out of the air"],
        ["Spin axis", "Tilt of the spin (degrees left/right)", "The measured cause of your draw, fade, hook, or slice"],
        ["Carry distance", "Yards the ball flies before landing", "The number gapping and club selection are built on"],
      ],
    },
    {
      type: "paragraph",
      text: "Higher-end systems add delivery data on top — attack angle (whether you hit up or down on the ball), club path, face angle, and impact location on the face. These explain why the ball numbers are what they are, which is what separates a fitting from a demo day.",
    },

    {
      type: "heading",
      level: 2,
      text: "Radar vs. camera: the two technologies",
    },
    {
      type: "paragraph",
      text: "Professional launch monitors come in two families, and the difference matters for where and how a shop fits.",
    },
    {
      type: "heading",
      level: 3,
      text: "Radar (Doppler) systems",
    },
    {
      type: "paragraph",
      text: "Radar units — TrackMan and FlightScope are the best-known — sit behind the golfer and use Doppler radar to track the ball through its actual flight. Because they follow the real ball, they excel outdoors and on driving ranges, where they can measure the full flight from launch to landing. Indoors, radar systems still work but have less flight to track before the ball hits a screen, so parts of the flight are calculated from the initial launch conditions rather than observed end to end.",
    },
    {
      type: "heading",
      level: 3,
      text: "Camera (photometric) systems",
    },
    {
      type: "paragraph",
      text: "Camera units — Foresight Sports' GCQuad and GC3 are the standard-bearers — sit beside the ball and photograph the club and ball at thousands of frames per second through the impact zone. Because everything they need happens in the hitting area, they are equally accurate indoors and outdoors, which is why they dominate indoor fitting studios and simulator bays. Their flight numbers are projected from directly measured launch conditions rather than a tracked flight.",
    },
    {
      type: "paragraph",
      text: "Both technologies are accurate enough to fit with — tour players are fitted on both. The practical takeaway: in an indoor studio, a camera system (or a radar system properly calibrated for indoor use) is a good sign; outdoors on grass with real ball flight, radar shines. What matters more than the brand is that the shop uses a professional-grade unit and a fitter who knows how to read it.",
    },

    {
      type: "heading",
      level: 2,
      text: "The numbers that matter in a fitting",
    },
    {
      type: "paragraph",
      text: "You don't need to master every metric — your fitter will. But three relationships do most of the work in a fitting, especially with the driver:",
    },
    {
      type: "list",
      items: [
        "Smash factor tells you about strike quality. With a driver, a smash factor approaching 1.50 means nearly all of your club speed is becoming ball speed. Consistently lower numbers point to off-center strikes or a head/shaft combination fighting your delivery — often fixable with equipment, not just practice.",
        "Launch angle and spin rate work as a pair. For most mid-handicap driver swings, a launch angle somewhere in the low-to-mid teens with spin in the low-to-mid 2,000s rpm is a typical healthy window — but the right combination depends on your ball speed, and a good fitter optimizes the pair together rather than chasing either number alone. Treat any published ranges as typical, not targets.",
        "Spin axis explains your shot shape. A spin axis tilted right produces a fade or slice; tilted left, a draw or hook. Seeing the actual degrees of tilt lets a fitter judge whether an equipment change (or a lesson) is the right fix for a curve.",
      ],
    },
    {
      type: "callout",
      title: "Ranges are starting points, not report cards",
      text: "Every 'ideal number' you read online assumes a particular ball speed and attack angle. A 90-mph swing and a 110-mph swing need different launch-and-spin windows to maximize carry. This is exactly why a live fitting beats a chart: the fitter optimizes your combination, on your swing, that day.",
    },

    {
      type: "heading",
      level: 2,
      text: "Why launch monitor data beats eyeballing",
    },
    {
      type: "paragraph",
      text: "Ball flight is a poor witness. Two drives can look nearly identical leaving the face while differing by 500 rpm of spin — enough to change carry distance meaningfully and to change which shaft is right for you. Feel is even less reliable: golfers routinely prefer the club that sounds better or looks better at address, even when the numbers show it costing them yards or widening their dispersion.",
    },
    {
      type: "paragraph",
      text: [
        "A launch monitor removes the argument. Every candidate club is measured against your baseline on the same screen, and the winner is whichever combination produces better ball speed, a tighter dispersion, or a healthier launch window — visibly, in your own data. That head-to-head process is the core of a modern fitting, as covered in our ",
        { text: "complete guide to golf club fitting", href: "/guides/golf-club-fitting" },
        ".",
      ],
    },

    {
      type: "heading",
      level: 2,
      text: "What to ask your fitter about their setup",
    },
    {
      type: "list",
      items: [
        "Which launch monitor do you use? Any professional unit (TrackMan, Foresight GCQuad/GC3, FlightScope, or similar) is a good answer. Vagueness about the system is a yellow flag for a paid fitting.",
        "Do you fit indoors, outdoors, or both? Neither is wrong — but if you strongly want to see real ball flight, ask for an outdoor or range-based session with a radar unit.",
        "Do you measure club delivery data or ball data only? Delivery data (path, face, attack angle, strike location) lets the fitter explain causes, not just outcomes.",
        "Will I get my numbers afterward? Good shops share the session data — it's useful for future fittings and for tracking your own progress.",
        "What ball will we hit? Premium balls give truer spin numbers than worn range balls; the best studios fit with the ball you actually play.",
      ],
    },
    {
      type: "paragraph",
      text: "Many shops in the directory publish which launch monitor systems they run — you'll find the brands listed on a shop's profile where the shop has made them public, so you can check the technology before you book.",
    },

    {
      type: "cta",
      heading: "Fit with real data, not guesswork",
      text: "Browse fitting studios and independent shops across all 50 states — many list the launch monitor systems they use right on their profile.",
      buttonLabel: "Find a Fitter Near You",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "What does a launch monitor measure?",
      answer:
        "A launch monitor measures the club and ball at impact: ball speed, club speed, smash factor (ball speed divided by club speed), launch angle, spin rate, spin axis, and carry distance. Higher-end systems also measure club delivery — attack angle, club path, face angle, and where on the face you struck the ball — which explains why the ball numbers are what they are.",
    },
    {
      question: "What's the difference between radar and camera launch monitors?",
      answer:
        "Radar (Doppler) systems like TrackMan and FlightScope sit behind the golfer and track the ball's actual flight, which makes them strongest outdoors. Camera (photometric) systems like the Foresight GCQuad and GC3 sit beside the ball and photograph impact at very high speed, which makes them equally accurate indoors — the reason they dominate indoor fitting studios. Both are accurate enough to fit tour players with.",
    },
    {
      question: "What launch monitor numbers matter most in a driver fitting?",
      answer:
        "Smash factor, launch angle, and spin rate do most of the work. Smash factor shows how efficiently your club speed becomes ball speed (approaching 1.50 is excellent with a driver). Launch angle and spin rate work as a pair — the right combination depends on your ball speed, which is why a fitter optimizes them together on a launch monitor rather than chasing chart numbers.",
    },
    {
      question: "Is a launch monitor fitting better than being fitted by eye?",
      answer:
        "Yes, decisively. Two shots can look identical in the air while differing by hundreds of rpm of spin — enough to change carry distance and which shaft suits you. A launch monitor measures every candidate club against your baseline in your own data, so the winning combination is proven rather than guessed. An experienced fitter's eye still matters for interpreting the data, but no serious modern fitting happens without the machine.",
    },
    {
      question: "Which launch monitor does my local fitting shop use?",
      answer:
        "Ask before you book — any professional-grade system (TrackMan, Foresight GCQuad or GC3, FlightScope, or similar) is a good sign, while vagueness about the equipment is a yellow flag for a paid fitting. Many shops in our directory publish their launch monitor brands on their profile, so you can check the technology a shop runs before booking.",
    },
  ],
  related: [
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
    {
      label: "What to Expect at a Golf Club Fitting",
      href: "/guides/what-to-expect-at-a-golf-club-fitting",
    },
    {
      label: "Golf Grip Size: How to Measure and Why It Matters",
      href: "/guides/golf-grip-size",
    },
    {
      label: "Iron Fitting: What Happens and Is It Worth It?",
      href: "/guides/iron-fitting",
    },
  ],
}
