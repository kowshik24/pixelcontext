const COMPUTED_STYLE_KEYS = [
  "display",
  "position",
  "width",
  "height",
  "margin",
  "padding",
  "font-size",
  "font-weight",
  "line-height",
  "color",
  "background",
  "background-color",
  "border",
  "border-radius",
  "box-shadow"
] as const

const getComputedSubset = (element: Element) => {
  const styles = getComputedStyle(element)
  return COMPUTED_STYLE_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = styles.getPropertyValue(key)
    return acc
  }, {})
}

const getMatchingCssRules = (element: Element) => {
  const matches = new Set<string>()

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList

    try {
      rules = sheet.cssRules
    } catch {
      continue
    }

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) {
        continue
      }

      try {
        if (element.matches(rule.selectorText)) {
          matches.add(`${rule.selectorText} { ${rule.style.cssText} }`)
        }
      } catch {
        // Invalid selector or browser quirks; skip.
      }
    }
  }

  return Array.from(matches).join("\n")
}

export const extractCssContext = (element: Element) => {
  const inline = element.getAttribute("style")
  const matchingRules = getMatchingCssRules(element)
  const computed = getComputedSubset(element)

  const inlineBlock = inline ? `/* inline */\n:root { ${inline} }` : ""
  const css = [matchingRules, inlineBlock].filter(Boolean).join("\n\n")

  return { css, computed }
}
