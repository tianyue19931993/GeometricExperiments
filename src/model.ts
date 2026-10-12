import type {
  DimensionKey,
  GeometryObject,
  SceneDimensions,
  ShapeType,
  Unit,
  Vec3Tuple,
} from './types'
import { SHAPE_LABELS } from './types'

const UNIT_TO_MM: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  dm: 100,
  m: 1000,
}
export const DIMENSION_KEYS: Record<ShapeType, DimensionKey[]> = {
  cube: ['edge'],
  cuboid: ['length', 'width', 'height'],
  cylinder: ['radius', 'height'],
  cone: ['radius', 'height'],
}

export const SHAPE_COLORS: Record<ShapeType, string> = {
  cube: '#6f63ff',
  cuboid: '#25a6a1',
  cylinder: '#ff9d42',
  cone: '#ed6689',
}

const DEFAULTS: Record<ShapeType, Partial<Record<DimensionKey, number>>> = {
  cube: { edge: 1 },
  cuboid: { length: 4, width: 3, height: 2 },
  cylinder: { radius: 1, height: 3 },
  cone: { radius: 1, height: 3 },
}

function objectPosition(index: number): Vec3Tuple {
  const column = index % 3
  const row = Math.floor(index / 3)
  return [(column - 1) * 4.2, 0, row * 4.2]
}

function objectLetter(index: number) {
  let value = index
  let result = ''
  do {
    result = String.fromCharCode(65 + (value % 26)) + result
    value = Math.floor(value / 26) - 1
  } while (value >= 0)
  return result
}

export function createGeometryObject(type: ShapeType, index: number): GeometryObject {
  const demoDimensions: Record<DimensionKey, number> = {
    edge: 1,
    length: 4,
    width: 3,
    height: 3,
    radius: 1,
    ...DEFAULTS[type],
  }
  const dimensions: Record<DimensionKey, number | null> = {
    edge: null,
    length: null,
    width: null,
    height: null,
    radius: null,
  }
  for (const key of DIMENSION_KEYS[type]) dimensions[key] = demoDimensions[key]

  return {
    id: `${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    name: `${SHAPE_LABELS[type]} ${objectLetter(index)}`,
    dimensions,
    demoDimensions,
    unit: 'cm',
    position: objectPosition(index),
    transparent: false,
    unfolded: false,
    radialMode: 'radius',
  }
}

export function convertValue(value: number, from: Unit, to: Unit) {
  return (value * UNIT_TO_MM[from]) / UNIT_TO_MM[to]
}

export function changeObjectUnit(object: GeometryObject, unit: Unit): GeometryObject {
  if (unit === object.unit) return object

  const dimensions = { ...object.dimensions }
  const demoDimensions = { ...object.demoDimensions }
  for (const key of Object.keys(dimensions) as DimensionKey[]) {
    const value = dimensions[key]
    dimensions[key] = value === null ? null : roundValue(convertValue(value, object.unit, unit))
    demoDimensions[key] = roundValue(convertValue(demoDimensions[key], object.unit, unit))
  }

  return { ...object, unit, dimensions, demoDimensions }
}

export function effectiveValue(object: GeometryObject, key: DimensionKey) {
  return object.dimensions[key] ?? object.demoDimensions[key]
}

export function sceneDimensions(object: GeometryObject): SceneDimensions {
  const edge = effectiveValue(object, 'edge')
  const length = effectiveValue(object, 'length')
  const width = effectiveValue(object, 'width')
  const height = effectiveValue(object, 'height')
  const radius = effectiveValue(object, 'radius')

  const raw =
    object.type === 'cube'
      ? { x: edge, y: edge, z: edge, radius: edge / 2 }
      : object.type === 'cuboid'
        ? { x: length, y: height, z: width, radius: Math.min(length, width) / 2 }
        : { x: radius * 2, y: height, z: radius * 2, radius }

  // One centimetre maps to a stable scene length. Using an object-relative
  // normalization here would make (for example) every cube look identical,
  // regardless of the edge value selected by the learner.
  const scale = (UNIT_TO_MM[object.unit] / UNIT_TO_MM.cm) * 0.6
  const toSceneLength = (value: number) => Math.min(12, Math.max(value * scale, 0.18))
  return {
    x: toSceneLength(raw.x),
    y: toSceneLength(raw.y),
    z: toSceneLength(raw.z),
    radius: Math.min(6, Math.max(raw.radius * scale, 0.09)),
  }
}

export function hasUnknownDimensions(object: GeometryObject) {
  return DIMENSION_KEYS[object.type].some((key) => object.dimensions[key] === null)
}

export function roundValue(value: number) {
  return Math.round(value * 1000) / 1000
}

export function displayDimension(object: GeometryObject, key: DimensionKey) {
  const value = object.dimensions[key]
  if (value === null) return '?'
  const displayed = key === 'radius' && object.radialMode === 'diameter' ? value * 2 : value
  return `${roundValue(displayed)} ${object.unit}`
}
