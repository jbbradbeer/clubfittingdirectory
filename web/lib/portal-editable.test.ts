import { describe, expect, it } from "vitest"
import { parseEditValue, type EditableField } from "./portal-editable"

const bool: EditableField = { attribute: "offers_fitting", label: "Offers club fitting", kind: "boolean" }
const list: EditableField = { attribute: "brands_fitted", label: "Brands fitted", kind: "text_array" }
const text: EditableField = { attribute: "phone", label: "Phone", kind: "text" }
const select: EditableField = {
  attribute: "fitting_environment",
  label: "Environment",
  kind: "select",
  options: [{ value: "indoor", label: "Indoor" }],
}

describe("parseEditValue — booleans (unticked checkbox is absent from FormData)", () => {
  it("unticking a true box proposes false", () => {
    expect(parseEditValue(bool, null, true)).toEqual({ changed: true, value: false })
  })
  it("ticking a false box proposes true", () => {
    expect(parseEditValue(bool, "on", false)).toEqual({ changed: true, value: true })
  })
  it("leaving an unknown (null) box unticked is not a change", () => {
    expect(parseEditValue(bool, null, null)).toEqual({ changed: false })
  })
  it("leaving a ticked box ticked is not a change", () => {
    expect(parseEditValue(bool, "on", true)).toEqual({ changed: false })
  })
})

describe("parseEditValue — lists", () => {
  it("blank textarea over a null value is not a change", () => {
    expect(parseEditValue(list, "", null)).toEqual({ changed: false })
  })
  it("blank textarea over an empty array is not a change", () => {
    expect(parseEditValue(list, "  \n ", [])).toEqual({ changed: false })
  })
  it("clearing a filled list proposes null, not []", () => {
    expect(parseEditValue(list, "", ["Titleist"])).toEqual({ changed: true, value: null })
  })
  it("one item per line, trimmed", () => {
    expect(parseEditValue(list, " Ping \nTitleist\n\n", null)).toEqual({
      changed: true,
      value: ["Ping", "Titleist"],
    })
  })
})

describe("parseEditValue — text and select", () => {
  it("missing text field is skipped", () => {
    expect(parseEditValue(text, null, "555")).toEqual({ changed: false })
  })
  it("blank text over null is not a change", () => {
    expect(parseEditValue(text, "   ", null)).toEqual({ changed: false })
  })
  it("rejects a select value outside the whitelist", () => {
    expect(parseEditValue(select, "outer-space", null)).toEqual({ changed: false })
  })
  it("accepts a whitelisted select value", () => {
    expect(parseEditValue(select, "indoor", null)).toEqual({ changed: true, value: "indoor" })
  })
})
