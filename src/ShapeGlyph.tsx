import type { ShapeType } from './types'

interface ShapeGlyphProps {
  type: ShapeType
}
export function ShapeGlyph({ type }: ShapeGlyphProps) {
  if (type === 'cylinder') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <ellipse cx="32" cy="16" rx="18" ry="8" />
        <path d="M14 16v30c0 4.5 8 8 18 8s18-3.5 18-8V16" />
        <path d="M14 46c0-4.5 8-8 18-8s18 3.5 18 8" className="glyph-hidden" />
      </svg>
    )
  }

  if (type === 'cone') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 8 13 48" />
        <path d="M32 8 51 48" />
        <ellipse cx="32" cy="48" rx="19" ry="8" />
      </svg>
    )
  }

  const wide = type === 'cuboid'
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d={wide ? 'M8 24 34 12l22 12-26 13Z' : 'M12 22 32 11l20 11-20 12Z'} />
      <path d={wide ? 'M8 24v25l22 7V37Z' : 'M12 22v26l20 8V34Z'} />
      <path d={wide ? 'M56 24v25l-26 7V37Z' : 'M52 22v26l-20 8V34Z'} />
    </svg>
  )
}
