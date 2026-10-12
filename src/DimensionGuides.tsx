import { Html, Line } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import type { GeometryObject, SceneDimensions, Vec3Tuple } from './types'
import { displayDimension, effectiveValue, roundValue } from './model'

interface DimensionMarkerProps {
  start: Vec3Tuple
  end: Vec3Tuple
  label: ReactNode
  labelPosition: Vec3Tuple
  color?: string
}

function DimensionLabel({ position, children }: { position: Vec3Tuple; children: ReactNode }) {
  const { gl } = useThree()
  const portal = useRef<HTMLElement>(gl.domElement.parentElement ?? gl.domElement)

  return (
    <Html
      portal={portal}
      position={position}
      center
      transform
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
    >
      <span className="dimension-label">{children}</span>
    </Html>
  )
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
      <DimensionLabel position={labelPosition}>{label}</DimensionLabel>
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

function namedDimension(object: GeometryObject, name: string, key: 'edge' | 'length' | 'width' | 'height' | 'radius') {
  return `${name} ${displayDimension(object, key)}`
}

function derivedDimension(name: string, value: number, unit: GeometryObject['unit']) {
  return `${name} ${roundValue(value)} ${unit}`
}

export function UnfoldedDimensionGuides({ object, dimensions }: DimensionGuidesProps) {
  const { x, y, z, radius } = dimensions
  const gap = 0.3
  const front = 0.08

  if (object.type === 'cube' || object.type === 'cuboid') {
    const netLift = z + 0.42
    const horizontalLabel = object.type === 'cube'
      ? namedDimension(object, '棱长', 'edge')
      : namedDimension(object, '长', 'length')
    const verticalLabel = object.type === 'cube'
      ? namedDimension(object, '棱长', 'edge')
      : namedDimension(object, '高', 'height')
    const flapLabel = object.type === 'cube'
      ? namedDimension(object, '棱长', 'edge')
      : namedDimension(object, '宽', 'width')

    return (
      <group>
        <DimensionMarker
          start={[-x, netLift - y / 2 - gap, front]}
          end={[0, netLift - y / 2 - gap, front]}
          label={horizontalLabel}
          labelPosition={[-x / 2, netLift - y / 2 - gap - 0.14, front]}
        />
        <DimensionMarker
          start={[gap, netLift - y / 2, front]}
          end={[gap, netLift + y / 2, front]}
          label={verticalLabel}
          labelPosition={[gap + 0.14, netLift, front]}
        />
        <DimensionMarker
          start={[gap, netLift + y / 2, front]}
          end={[gap, netLift + y / 2 + z, front]}
          label={flapLabel}
          labelPosition={[gap + 0.14, netLift + y / 2 + z / 2, front]}
        />
      </group>
    )
  }

  const rawRadius = effectiveValue(object, 'radius')
  const rawHeight = effectiveValue(object, 'height')
  const radiusName = object.radialMode === 'diameter' ? '直径' : '半径'

  if (object.type === 'cylinder') {
    const halfCircumference = Math.PI * radius
    return (
      <group>
        <DimensionMarker
          start={[-halfCircumference, y / 2 - 0.16, front]}
          end={[halfCircumference, y / 2 - 0.16, front]}
          label={derivedDimension('侧面周长', Math.PI * 2 * rawRadius, object.unit)}
          labelPosition={[0, y / 2 - 0.34, front]}
        />
        <DimensionMarker
          start={[halfCircumference + gap, -y / 2, front]}
          end={[halfCircumference + gap, y / 2, front]}
          label={namedDimension(object, '高', 'height')}
          labelPosition={[halfCircumference + gap + 0.16, 0, front]}
        />
        <DimensionMarker
          start={[0, y / 2 + radius, front]}
          end={[radius, y / 2 + radius, front]}
          label={namedDimension(object, radiusName, 'radius')}
          labelPosition={[radius / 2, y / 2 + radius + 0.16, front]}
        />
      </group>
    )
  }

  const slant = Math.hypot(radius, y)
  const rawSlant = Math.hypot(rawRadius, rawHeight)
  const apexY = (slant + radius) / 2
  const diskY = apexY - slant - radius
  return (
    <group>
      <DimensionMarker
        start={[0, apexY, front]}
        end={[0, apexY - slant, front]}
        label={derivedDimension('母线', rawSlant, object.unit)}
        labelPosition={[0.22, apexY - slant / 2, front]}
      />
      <DimensionMarker
        start={[0, diskY, front]}
        end={[radius, diskY, front]}
        label={namedDimension(object, radiusName, 'radius')}
        labelPosition={[radius / 2, diskY + 0.16, front]}
      />
      <DimensionLabel position={[slant * 0.62, apexY + gap, front]}>
        {namedDimension(object, '原立体高', 'height')}
      </DimensionLabel>
    </group>
  )
}
