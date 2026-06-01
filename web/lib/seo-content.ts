import type { FaqItem } from "@/components/seo/FaqSection"

/**
 * Generates location/category-specific intro copy and FAQs for collection pages.
 * Interpolating the place/category name keeps each page's text unique (avoiding
 * the "thin / duplicate content" risk of hundreds of near-identical pages) while
 * staying genuinely useful and accurate.
 */

/* ── Intro paragraph ── */
export function stateIntro(stateName: string, shopCount: number, cityCount: number): string {
  return `Looking for golf club fitting in ${stateName}? Browse ${shopCount} independent fitters, retailers, and simulators across ${cityCount} ${
    cityCount === 1 ? "city" : "cities"
  }. Each listing shows services, ratings, and contact details so you can find the right fit close to home.`
}

export function cityIntro(city: string, stateName: string, shopCount: number): string {
  return `Find golf club fitting in ${city}, ${stateName}. We list ${shopCount} ${
    shopCount === 1 ? "shop" : "shops"
  } offering custom club fitting, equipment retail, and simulator sessions — compare ratings and services to book the fitting that suits your game.`
}

export function categoryIntro(label: string, shopCount: number, stateCount: number): string {
  return `Browse ${shopCount} ${label.toLowerCase()} across ${stateCount} ${
    stateCount === 1 ? "state" : "states"
  }. Compare ratings, services, and locations to find the right option for your game.`
}

/* ── FAQs ── */
function baseFittingFaqs(): FaqItem[] {
  return [
    {
      question: "What is golf club fitting?",
      answer:
        "Club fitting is the process of matching golf clubs to your swing, body, and goals — adjusting factors like shaft, length, lie angle, loft, and grip. A proper fitting can improve consistency, distance, and accuracy.",
    },
    {
      question: "How much does a club fitting cost?",
      answer:
        "Prices vary by shop and fitting type, but a single-club fitting often ranges from around $50 to $150, while a full-bag fitting can cost more. Many retailers credit the fitting fee toward clubs you purchase.",
    },
    {
      question: "How long does a fitting take?",
      answer:
        "A single-club fitting typically takes 30–60 minutes, while a full-bag fitting can take two hours or more. It's best to book ahead so the fitter can allocate enough time.",
    },
  ]
}

export function stateFaqs(stateName: string): FaqItem[] {
  return [
    {
      question: `How do I find a golf club fitter in ${stateName}?`,
      answer: `Use this directory to browse fitters by city across ${stateName}. Each listing includes the shop's services, rating, and contact information so you can compare options near you.`,
    },
    ...baseFittingFaqs(),
  ]
}

export function cityFaqs(city: string, stateName: string): FaqItem[] {
  return [
    {
      question: `Where can I get fitted for golf clubs in ${city}?`,
      answer: `The shops listed on this page offer club fitting in and around ${city}, ${stateName}. Check each listing's services and rating, then contact the shop directly to book a session.`,
    },
    ...baseFittingFaqs(),
  ]
}

export function categoryFaqs(label: string): FaqItem[] {
  return [
    {
      question: `What should I look for when choosing ${label.toLowerCase()}?`,
      answer: `Compare ratings, the specific services offered, and proximity to you. Listings that offer custom fitting, modern technology, and strong reviews are a good starting point.`,
    },
    ...baseFittingFaqs(),
  ]
}
