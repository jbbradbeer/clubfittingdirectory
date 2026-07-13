import type { Guide } from "@/lib/guides/types"

/* Flagship annual data report built from the directory's own dataset —
   original statistics no other publisher has (see
   tasks/research/directory-stats-2026-06.md for the computation notes).
   Refresh the numbers and the year annually. */
export const stateOfClubFitting2026: Guide = {
  slug: "state-of-club-fitting-2026",
  metaTitle: "The State of Club Fitting in America: 2026 Report",
  metaDescription:
    "Original data from 1,268 golf shops across all 50 states: real fitting prices (median $120), TrackMan's 66% market share, the indoor takeover, and per-capita access rankings.",
  targetKeyword: "club fitting statistics",
  eyebrow: "2026 Data Report",
  h1: "The State of Club Fitting in America (2026)",
  excerpt:
    "What 1,268 golf shops across all 50 states reveal about club fitting access in America — including the four big golf states that rank dead last per capita.",
  keyTakeaways: [
    "Only 44.8% of the 1,268 golf shops analyzed (568 shops) explicitly offer club fitting; the rest focus on retail, instruction, simulator rental, or repair.",
    "Indoor fitting has won: 87% of fitting providers with a known environment fit indoors (486 shops) versus just 13% outdoors (75 shops).",
    "Ohio and New York tie for the most listed shops at 59 each, but Vermont leads the nation per capita with 26.2 shops per million residents against a national average of 3.7.",
    "California, Texas, Florida, and New York hold about a third of the U.S. population but only 16% of listed golf shops, and California ranks dead last at 1.3 shops per million residents.",
    "Across 1,255 shops with a public rating, the average is 4.46 out of 5, with Indiana (4.80) and South Carolina (4.79) leading states with 15+ shops.",
    "The median published entry-level fitting price at independent shops is $120, and 35% of shops with published prices offer a fitting for under $100 (91-shop sample, July 2026).",
    "TrackMan is the launch monitor in 66% of the 310 tech-verified fitting shops, with Foresight's GCQuad/GC3 second at 28%.",
  ],
  readMinutes: 11,
  datePublished: "2026-06-11",
  dateModified: "2026-07-06",
  blocks: [
    {
      type: "paragraph",
      text: "Where can American golfers actually get fitted for clubs? To find out, we analyzed every shop in this directory — 1,268 independent golf retailers, club fitters, simulators, and pro shops across all 50 states and Washington, D.C. The result is the first public snapshot of club fitting access in America: who offers it, where it's easy to find, and where golfers are driving hours for a launch monitor.",
    },
    {
      type: "callout",
      title: "Key findings at a glance",
      text: [
        "1) Fewer than half of golf shops (44.8%) explicitly offer club fitting. 2) Indoor fitting has effectively won: 87% of fitting providers fit indoors. 3) Vermont — not Florida or Arizona — has America's highest density of golf shops per resident. 4) The four biggest golf states (California, Texas, Florida, New York) hold about a third of the U.S. population but only 16% of its listed golf shops.",
      ],
    },

    { type: "heading", level: 2, text: "Only 45% of golf shops offer club fitting" },
    {
      type: "paragraph",
      text: "Of the 1,268 shops in the directory, 568 — 44.8% — explicitly offer club fitting services. The rest focus on retail, instruction, simulator rental, or repair. For golfers, the takeaway is simple: the nearest golf shop is not necessarily a fitting shop, which is exactly why finding a dedicated fitter takes some searching.",
    },
    {
      type: "table",
      caption: "What the 1,268 listed shops are (a shop has one primary type).",
      headers: ["Shop type", "Count", "Share"],
      rows: [
        ["Retailer", "424", "33%"],
        ["Dedicated club fitter", "377", "30%"],
        ["Simulator facility", "262", "21%"],
        ["Instruction studio", "81", "6%"],
        ["Driving range", "77", "6%"],
        ["Golf course / pro shop", "47", "4%"],
      ],
    },
    {
      type: "paragraph",
      text: "Services overlap heavily: 42% of all shops offer lessons, 32% have simulators, 27% handle club repair, and 26% list regripping. The one-stop independent shop — fit you, build the clubs, repair them later — is alive and well in America.",
    },

    { type: "heading", level: 2, text: "The indoor takeover: 87% of fittings happen inside" },
    {
      type: "paragraph",
      text: "Of the fitting providers whose environment we could verify, 486 fit indoors and just 75 fit outdoors. Launch monitors and simulator bays have made the indoor fitting the default American fitting experience — outdoor, see-the-ball-fly fittings are now a specialty worth seeking out if you want to validate your numbers on real turf.",
    },
    {
      type: "table",
      caption: "Fitting environment among providers that offer club fitting (561 with known environment).",
      headers: ["Environment", "Providers", "Share"],
      rows: [
        ["Indoor (launch monitor / sim bay)", "486", "87%"],
        ["Outdoor (range or course)", "75", "13%"],
      ],
    },

    { type: "heading", level: 2, text: "Where the shops are: Ohio ties New York for #1" },
    {
      type: "paragraph",
      text: "By raw count, the Midwest and Northeast dominate. Ohio and New York tie for the most listed shops, with Pennsylvania one behind — while famous golf destinations sit surprisingly far down the table.",
    },
    {
      type: "table",
      caption: "States with the most listed golf shops (2026).",
      headers: ["Rank", "State", "Shops"],
      rows: [
        ["1 (tie)", "Ohio", "59"],
        ["1 (tie)", "New York", "59"],
        ["3", "Pennsylvania", "57"],
        ["4 (tie)", "Texas", "54"],
        ["4 (tie)", "Michigan", "54"],
        ["6", "California", "53"],
        ["7", "Virginia", "52"],
        ["8", "North Carolina", "51"],
        ["9 (tie)", "New Jersey", "44"],
        ["9 (tie)", "Massachusetts", "44"],
      ],
    },
    {
      type: "paragraph",
      text: "At the other end: Alaska has a single listed shop, Wyoming two, and Washington, D.C. three. If you're fitting-shopping in those places, expect a road trip.",
    },

    { type: "heading", level: 2, text: "The access paradox: big golf states, thin fitting access" },
    {
      type: "paragraph",
      text: "Adjust for population and the map flips. California, Texas, Florida, and New York together hold roughly a third of the U.S. population — but only 16% of its listed golf shops. California ranks dead last in the country at 1.3 shops per million residents. Meanwhile, northern New England quietly leads the nation.",
    },
    {
      type: "table",
      caption: "Golf shops per million residents (2024 population estimates). National average: 3.7.",
      headers: ["Rank", "State", "Shops per million", "Shops"],
      rows: [
        ["1", "Vermont", "26.2", "17"],
        ["2", "New Hampshire", "13.5", "19"],
        ["3", "North Dakota", "12.5", "10"],
        ["4", "Rhode Island", "10.8", "12"],
        ["5", "Hawaii", "10.3", "15"],
        ["6", "Connecticut", "9.8", "36"],
        ["7", "Maine", "8.5", "12"],
        ["8", "Iowa", "8.3", "27"],
        ["…", "—", "—", "—"],
        ["48", "Texas", "1.7", "54"],
        ["49", "Alabama", "1.6", "8"],
        ["50", "Mississippi", "1.4", "4"],
        ["51", "California", "1.3", "53"],
      ],
    },
    {
      type: "paragraph",
      text: "Why? Big-population states lean on national fitting chains and on-course pro shops, while small states with strong golf cultures sustain a dense web of independent shops. For golfers in underserved metros, the practical move is searching by city rather than assuming the nearest big-box store fits clubs.",
    },
    {
      type: "callout",
      title: "Fitting deserts",
      text: "Five states or districts have one or zero dedicated club-fitting providers in the directory: Alaska, Delaware, Washington D.C., Wisconsin, and Wyoming. (Shops there may still fit clubs without advertising it — but the listed options are thin.)",
    },

    { type: "heading", level: 2, text: "The best-rated fitting states" },
    {
      type: "paragraph",
      text: "Across 1,255 shops with a public rating, the average is 4.46 out of 5 — independent golf shops are, on the whole, beloved by their customers. Among states with at least 15 listed shops, Indiana and South Carolina lead the country.",
    },
    {
      type: "table",
      caption: "Highest average shop rating, states with 15+ listed shops.",
      headers: ["Rank", "State", "Average rating", "Shops"],
      rows: [
        ["1", "Indiana", "4.80", "23"],
        ["2", "South Carolina", "4.79", "24"],
        ["3", "Florida", "4.74", "41"],
        ["4", "Missouri", "4.72", "20"],
        ["5", "Colorado", "4.71", "24"],
        ["6", "Minnesota", "4.70", "37"],
        ["7", "Hawaii", "4.69", "15"],
        ["8", "Illinois", "4.68", "42"],
        ["8", "Michigan", "4.68", "54"],
        ["10", "New Jersey", "4.62", "44"],
      ],
    },

    { type: "heading", level: 2, text: "What a club fitting actually costs in 2026" },
    {
      type: "paragraph",
      text: [
        "In July 2026 we crawled the websites of every shop in the directory and recorded published fitting prices wherever a shop lists them — 91 shops across 37 states so far. The result is the first public sample of what ",
        { text: "independent", href: "/directory?ownership=independent" },
        " fitters (as opposed to national chains) actually charge: the median entry-level fitting is $120, and just over a third of shops with published prices offer a fitting for under $100.",
      ],
    },
    {
      type: "table",
      caption:
        "Published entry-level fitting prices at the 91 directory shops that list prices on their website (July 2026).",
      headers: ["Entry-level fitting price", "Shops", "Share"],
      rows: [
        ["Under $100", "32", "35%"],
        ["$100–$199", "28", "31%"],
        ["$200–$299", "8", "9%"],
        ["$300 and up", "23", "25%"],
      ],
    },
    {
      type: "paragraph",
      text: "Cheapest published fitting in the sample: $40. At the top end — typically full-bag fittings and tour-style experiences — the median high price is $350, and the most expensive published fitting is $1,200. Averages run higher than medians (entry $190, top $358) because a handful of premium studios pull the mean up. For comparison, national fitting chains' published menus generally run from about $100 for a single-club fitting to $400 or more for a full bag.",
    },

    { type: "heading", level: 2, text: "The tech in the bay: TrackMan runs two-thirds of fitting studios" },
    {
      type: "paragraph",
      text: "The same crawl verified which launch monitor each shop advertises — 310 shops name their system. TrackMan dominates American fitting bays, appearing in 66% of tech-verified shops, with Foresight's camera-based units (GCQuad, GC3) a clear second. Forty-two shops run two or more systems.",
    },
    {
      type: "table",
      caption: "Launch monitors advertised by the 310 tech-verified shops (a shop can run more than one).",
      headers: ["System", "Shops", "Share of tech-verified shops"],
      rows: [
        ["TrackMan", "204", "66%"],
        ["Foresight (GCQuad / GC3)", "88", "28%"],
        ["FlightScope", "26", "8%"],
        ["SAM PuttLab", "19", "6%"],
        ["Full Swing", "10", "3%"],
        ["SkyTrak", "10", "3%"],
        ["Quintic", "5", "2%"],
      ],
    },

    { type: "heading", level: 2, text: "America's fitting shops are overwhelmingly independent" },
    {
      type: "paragraph",
      text: "We also classified every listing by ownership: 95.5% of the shops in the directory are independently owned (1,189 of 1,245 active listings), alongside 31 brand-owned fitting studios, 13 big-box locations, and 12 national fitting-chain studios. Among shops that explicitly offer club fitting, 92% are independent — the American club fitting landscape outside the top-50 metros is an independent-shop story.",
    },

    { type: "heading", level: 2, text: "Methodology" },
    {
      type: "paragraph",
      text: "Statistics were computed in June 2026 from the Club Fitting Directory's database of 1,268 active listings spanning all 50 states and Washington, D.C., across 834 cities; 88% of listings are verified. \"Offers club fitting\" reflects services the shop explicitly advertises, so true fitting availability may be modestly higher. Per-capita figures use U.S. Census Bureau 2024 state population estimates. Ratings are public customer ratings as collected at enrichment time. The directory focuses on independent shops, so national chain locations are intentionally under-represented. Pricing, launch monitor, and ownership statistics were added in July 2026 from a crawl of every listed shop's own website (1,245 active listings at crawl time); prices reflect what shops publish and were sanity-checked by hand. We'll refresh this report annually.",
    },

    {
      type: "cta",
      heading: "Find a club fitter near you",
      text: "Search 700+ hand-vetted independent fitters, retailers, and simulators across all 50 states.",
      buttonLabel: "Search the directory",
      href: "/directory",
    },
  ],
  faqs: [
    {
      question: "How many golf club fitting shops are there in the US?",
      answer:
        "This report analyzed 1,268 independent golf shops across all 50 states as of June 2026, of which 568 (44.8%) explicitly offered club fitting. Including national chains and on-course pro shops that fit informally, the true number of fitting providers in the US is somewhat higher. The directory has since been curated down to 700+ hand-vetted shops.",
    },
    {
      question: "Which state has the most golf club fitters?",
      answer:
        "Ohio and New York tie for the most listed golf shops (59 each), followed by Pennsylvania (57). Per capita, however, Vermont leads the nation with 26.2 shops per million residents — seven times the national average of 3.7.",
    },
    {
      question: "Are most golf club fittings done indoors or outdoors?",
      answer:
        "Indoors, by a wide margin: 87% of fitting providers in this directory fit indoors using launch monitors or simulator bays, while only 13% offer outdoor fittings on a range or course.",
    },
    {
      question: "How much does a golf club fitting cost at an independent shop?",
      answer:
        "Among the 91 directory shops that publish fitting prices on their websites (July 2026), the median entry-level fitting costs $120, and 35% offer a fitting for under $100. Full-bag and premium fittings run higher — the median top price is $350, and the most expensive published fitting is $1,200.",
    },
    {
      question: "What launch monitor do most club fitters use?",
      answer:
        "TrackMan, by a wide margin: 66% of the 310 shops that advertise their launch monitor use TrackMan, followed by Foresight camera-based units (GCQuad/GC3) at 28% and FlightScope at 8%. Forty-two shops run two or more systems.",
    },
    {
      question: "Which states have the fewest club fitting options?",
      answer:
        "Alaska (1 listed shop), Wyoming (2), and Washington D.C. (3) have the fewest listings overall. Adjusted for population, California ranks last in the country at just 1.3 golf shops per million residents.",
    },
  ],
  related: [
    { label: "Golf Club Fitting: The Complete Guide", href: "/guides/golf-club-fitting" },
    { label: "Club Champion vs. an Independent Fitter: Prices Compared", href: "/guides/club-champion-vs-independent-fitter" },
    { label: "Where to Get Fitted for Golf Clubs", href: "/guides/where-to-get-fitted-for-golf-clubs" },
    { label: "Browse fitters by state", href: "/states" },
  ],
}
