export type ShapeType = 'cube' | 'cuboid' | 'cylinder' | 'cone'
export type Unit = 'mm' | 'cm' | 'dm' | 'm'
export type RadialMode = 'radius' | 'diameter'
export type DimensionKey = 'edge' | 'length' | 'width' | 'height' | 'radius'

export type Vec3Tuple = [number, number, number]

export interface GeometryObject {
  id: string
  type: ShapeType
  name: string
  dimensions: Record<DimensionKey, number | null>
  demoDimensions: Record<DimensionKey, number>
  unit: Unit
  position: Vec3Tuple
  transparent: boolean
  unfolded: boolean
  radialMode: RadialMode
}
export interface SceneDimensions {
  x: number
  y: number
  z: number
  radius: number
}

export const SHAPE_LABELS: Record<ShapeType, string> = {
  cube: '正方体',
  cuboid: '长方体',
  cylinder: '圆柱体',
  cone: '圆锥体',
}

export const UNIT_LABELS: Record<Unit, string> = {
  mm: '毫米 mm',
  cm: '厘米 cm',
  dm: '分米 dm',
  m: '米 m',
}
