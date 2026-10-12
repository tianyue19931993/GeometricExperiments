import { Html, Line } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { GeometryObject, SceneDimensions, Vec3Tuple } from './types'
import { displayDimension } from './model'

interface DimensionMarkerProps {
  start: Vec3Tuple
  end: Vec3Tuple
  label: ReactNode
  labelPosition: Vec3Tuple
  color?: string
}
function DimensionMarker({
  start,
  end,
  label,
  labelPosition,
  color = '#40536b',
}: DimensionMarkerProps) {
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={1.5} />
      <Html position={labelPosition} center transform distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <span className="dimension-label">{label}</span>
      </Html>
    </group>
  )
}
interface DimensionGuidesProps {
  object: GeometryObject
  dimensions: SceneDimensions
}

export function DimensionGuides({ object, dimensions }: DimensionGuidesProps) {
  const { x, y, z, radius } = dimensions
  const gap = 0.28

  if (object.type === 'cube') {
    return (
      <DimensionMarker
        start={[-x / 2, -y / 2 - gap, z / 2]}
        end={[x / 2, -y / 2 - gap, z / 2]}
        label={displayDimension(object, 'edge')}
        labelPosition={[0, -y / 2 - gap - 0.12, z / 2]}
      />
    )
  }

  if (object.type === 'cuboid') {
    return (
      <group>
        <DimensionMarker
          start={[-x / 2, -y / 2 - gap, z / 2]}
          end={[x / 2, -y / 2 - gap, z / 2]}
          label={displayDimension(object, 'length')}
          labelPosition={[0, -y / 2 - gap - 0.12, z / 2]}
        />
        <DimensionMarker
          start={[x / 2 + gap, -y / 2, z / 2]}
          end={[x / 2 + gap, y / 2, z / 2]}
          label={displayDimension(object, 'height')}
          labelPosition={[x / 2 + gap + 0.12, 0, z / 2]}
        />
        <DimensionMarker
          start={[-x / 2 - gap, -y / 2, -z / 2]}
          end={[-x / 2 - gap, -y / 2, z / 2]}
          label={displayDimension(object, 'width')}
          labelPosition={[-x / 2 - gap - 0.12, -y / 2, 0]}
        />
      </group>
    )
  }

  const radialLabel = displayDimension(object, 'radius')
  const radialStart: Vec3Tuple = object.radialMode === 'diameter' ? [-radius, -y / 2 - gap, 0] : [0, -y / 2 - gap, 0]
  return (
    <group>
      <DimensionMarker
        start={radialStart}
        end={[radius, -y / 2 - gap, 0]}
        label={radialLabel}
        labelPosition={object.radialMode === 'diameter' ? [0, -y / 2 - gap - 0.12, 0] : [radius / 2, -y / 2 - gap - 0.12, 0]}
      />
      <DimensionMarker
        start={[radius + gap, -y / 2, 0]}
        end={[radius + gap, y / 2, 0]}
        label={displayDimension(object, 'height')}
        labelPosition={[radius + gap + 0.12, 0, 0]}
      />
    </group>
  )
}
