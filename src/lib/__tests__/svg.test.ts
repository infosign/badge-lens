import { describe, it, expect } from 'vitest'
import { extractFromSvgText } from '../extractors/svg'
import { BadgeExtractionError } from '../../types/badges'

const ASSERTION_JSON = JSON.stringify({ '@context': 'https://w3id.org/badges/v2', type: 'Assertion' })

function makeSvg(scriptContent: string, attrs = 'id="openbadges" type="application/ld+json"') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect width="100" height="100" fill="blue"/>
  <script ${attrs}>${scriptContent}</script>
</svg>`
}

describe('extractFromSvgText', () => {
  it('id="openbadges" の script タグから JSON を抽出する', () => {
    const svg = makeSvg(ASSERTION_JSON)
    const result = extractFromSvgText(svg)
    expect(JSON.parse(result)).toEqual(JSON.parse(ASSERTION_JSON))
  })

  it('id がなくても type="application/ld+json" の script タグを使う', () => {
    const svg = makeSvg(ASSERTION_JSON, 'type="application/ld+json"')
    const result = extractFromSvgText(svg)
    expect(JSON.parse(result)).toEqual(JSON.parse(ASSERTION_JSON))
  })

  it('前後の空白をトリムする', () => {
    const svg = makeSvg(`  \n  ${ASSERTION_JSON}  \n  `)
    const result = extractFromSvgText(svg)
    expect(JSON.parse(result)).toEqual(JSON.parse(ASSERTION_JSON))
  })

  it('script タグがない場合は NO_METADATA エラー', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>`
    expect(() => extractFromSvgText(svg)).toThrowError(BadgeExtractionError)
    try {
      extractFromSvgText(svg)
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('NO_METADATA')
    }
  })

  it('SVG ではないコンテンツは NOT_SVG エラー', () => {
    expect(() => extractFromSvgText('{"json": true}')).toThrowError(BadgeExtractionError)
    try {
      extractFromSvgText('{"json": true}')
    } catch (e) {
      expect(e instanceof BadgeExtractionError && e.code).toBe('NOT_SVG')
    }
  })

  it('壊れた XML は NOT_SVG エラー', () => {
    expect(() => extractFromSvgText('<svg><unclosed')).toThrowError(BadgeExtractionError)
  })

  it('script の中身が空の場合は NO_METADATA エラー', () => {
    const svg = makeSvg('')
    expect(() => extractFromSvgText(svg)).toThrowError(BadgeExtractionError)
  })
})
