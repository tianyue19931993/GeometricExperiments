import { Edges } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { DimensionGuides, UnfoldedDimensionGuides } from './DimensionGuides'
import { sceneDimensions, SHAPE_COLORS } from './model'
import type { GeometryObject, SceneDimensions, Vec3Tuple } from './types'

interface GeometryModelProps {
  object: GeometryObject
  selected: boolean
  dragging: boolean
  onSelect: (id: string) => void
  onMoveStart: (id: string) => void
  onMove: (id: string, position: Vec3Tuple) => void
  onMoveEnd: () => void
  onHover: (hovered: boolean) => void
}
interface Transform {
  position: Vec3Tuple
  rotation: Vec3Tuple
}

function useUnfoldProgress(unfolded: boolean) {
  const progress = useRef(unfolded ? 1 : 0)

  useEffect(() => {
    const animation = gsap.to(progress, {
      current: unfolded ? 1 : 0,
      duration: 0.9,
      ease: 'power2.inOut',
      overwrite: true,
    })
    return () => {
      animation.kill()
    }
  }, [unfolded])

  return progress
}

function useAnimatedTransform(
  ref: React.RefObject<THREE.Group | null>,
  progress: React.RefObject<number>,
  solid: Transform,
  flat: Transform,
) {
  const solidQuaternion = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(...solid.rotation)),
    [solid.rotation],
  )
  const flatQuaternion = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(...flat.rotation)),
    [flat.rotation],
  )

  useFrame(() => {
    if (!ref.current) return
    const value = progress.current
    ref.current.position.set(
      THREE.MathUtils.lerp(solid.position[0], flat.position[0], value),
      THREE.MathUtils.lerp(solid.position[1], flat.position[1], value),
      THREE.MathUtils.lerp(solid.position[2], flat.position[2], value),
    )
    ref.current.quaternion.slerpQuaternions(solidQuaternion, flatQuaternion, value)
  })
}

interface FacePanelProps {
  size: [number, number]
  solid: Transform
  flat: Transform
  progress: React.RefObject<number>
  color: string
  transparent: boolean
  selected: boolean
}

function FacePanel({ size, solid, flat, progress, color, transparent, selected }: FacePanelProps) {
  const ref = useRef<THREE.Group>(null)
  useAnimatedTransform(ref, progress, solid, flat)
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={size} />
        <meshPhysicalMaterial
          color={color}
          emissive={selected ? '#332b88' : '#000000'}
          emissiveIntensity={selected ? 0.16 : 0}
          roughness={0.34}
          metalness={0.04}
          transparent={transparent}
          opacity={transparent ? 0.38 : 0.94}
          depthWrite={!transparent}
          side={THREE.DoubleSide}
        />
        <Edges color={selected ? '#4338ca' : '#40536b'} lineWidth={selected ? 2.3 : 1.35} />
      </mesh>
    </group>
  )
}
function BoxModel({
  dimensions,
  object,
  selected,
  progress,
}: {
  dimensions: SceneDimensions
  object: GeometryObject
  selected: boolean
  progress: React.RefObject<number>
}) {
  const { x, y, z } = dimensions
  const netLift = z + 0.42
  const netRotation: Vec3Tuple = [0, 0, 0]
  const color = SHAPE_COLORS[object.type]
  const faces: Array<{ key: string; size: [number, number]; solid: Transform; flat: Transform }> = [
    {
      key: 'front',
      size: [x, y],
      solid: { position: [0, 0, z / 2], rotation: [0, 0, 0] },
      flat: { position: [-x / 2, netLift, 0], rotation: netRotation },
    },
    {
      key: 'back',
      size: [x, y],
      solid: { position: [0, 0, -z / 2], rotation: [0, Math.PI, 0] },
      flat: { position: [x / 2 + z, netLift, 0], rotation: netRotation },
    },
    {
      key: 'left',
      size: [z, y],
      solid: { position: [-x / 2, 0, 0], rotation: [0, -Math.PI / 2, 0] },
      flat: { position: [-x - z / 2, netLift, 0], rotation: netRotation },
    },
    {
      key: 'right',
      size: [z, y],
      solid: { position: [x / 2, 0, 0], rotation: [0, Math.PI / 2, 0] },
      flat: { position: [z / 2, netLift, 0], rotation: netRotation },
    },
    {
      key: 'top',
      size: [x, z],
      solid: { position: [0, y / 2, 0], rotation: [-Math.PI / 2, 0, 0] },
      flat: { position: [-x / 2, netLift + (y + z) / 2, 0], rotation: netRotation },
    },
    {
      key: 'bottom',
      size: [x, z],
      solid: { position: [0, -y / 2, 0], rotation: [Math.PI / 2, 0, 0] },
      flat: { position: [-x / 2, netLift - (y + z) / 2, 0], rotation: netRotation },
    },
  ]

  return (
    <group>
      {faces.map(({ key, ...face }) => (
        <FacePanel
          key={key}
          {...face}
          progress={progress}
          color={color}
          transparent={object.transparent}
          selected={selected}
        />
      ))}
      {object.unfolded
        ? <UnfoldedDimensionGuides object={object} dimensions={dimensions} />
        : <DimensionGuides object={object} dimensions={dimensions} />}
    </group>
  )
}

interface SurfaceData {
  solid: Float32Array
  flat: Float32Array
  indices: number[]
}

function createCylinderSurface(radius: number, height: number): SurfaceData {
  const segments = 64
  const solid: number[] = []
  const flat: number[] = []
  const indices: number[] = []
  for (let row = 0; row <= 1; row += 1) {
    const y = -height / 2 + row * height
    for (let index = 0; index <= segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2
      solid.push(radius * Math.cos(angle), y, radius * Math.sin(angle))
      flat.push((angle - Math.PI) * radius, y, 0)
    }
  }
  for (let index = 0; index < segments; index += 1) {
    const nextRow = segments + 1
    indices.push(index, index + nextRow, index + 1, index + 1, index + nextRow, index + nextRow + 1)
  }
  return { solid: new Float32Array(solid), flat: new Float32Array(flat), indices }
}

function createConeSurface(radius: number, height: number): SurfaceData {
  const segments = 64
  const rows = 14
  const solid: number[] = []
  const flat: number[] = []
  const indices: number[] = []
  const slant = Math.hypot(radius, height)
  const sectorAngle = (Math.PI * 2 * radius) / slant
  const apexY = (slant + radius) / 2

  for (let row = 0; row <= rows; row += 1) {
    const amount = row / rows
    for (let index = 0; index <= segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2
      const sector = -sectorAngle / 2 + (index / segments) * sectorAngle
      solid.push(amount * radius * Math.cos(angle), height / 2 - amount * height, amount * radius * Math.sin(angle))
      flat.push(amount * slant * Math.sin(sector), apexY - amount * slant * Math.cos(sector), 0)
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let index = 0; index < segments; index += 1) {
      const current = row * (segments + 1) + index
      const next = current + segments + 1
      indices.push(current, next, current + 1, current + 1, next, next + 1)
    }
  }
  return { solid: new Float32Array(solid), flat: new Float32Array(flat), indices }
}

function MorphSurface({
  data,
  progress,
  color,
  transparent,
  selected,
}: {
  data: SurfaceData
  progress: React.RefObject<number>
  color: string
  transparent: boolean
  selected: boolean
}) {
  const geometry = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(data.solid.slice(), 3))
    result.setIndex(data.indices)
    result.computeVertexNormals()
    return result
  }, [data])
  const lastProgress = useRef(-1)

  useEffect(() => {
    lastProgress.current = -1
    return () => geometry.dispose()
  }, [geometry])

  useFrame(() => {
    const value = progress.current
    if (Math.abs(value - lastProgress.current) < 0.0001) return
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute
    const positions = attribute.array as Float32Array
    for (let index = 0; index < positions.length; index += 1) {
      positions[index] = THREE.MathUtils.lerp(data.solid[index], data.flat[index], value)
    }
    attribute.needsUpdate = true
    geometry.computeVertexNormals()
    lastProgress.current = value
  })

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={color}
        emissive={selected ? '#6b3b16' : '#000000'}
        emissiveIntensity={selected ? 0.14 : 0}
        roughness={0.38}
        metalness={0.02}
        transparent={transparent}
        opacity={transparent ? 0.38 : 0.94}
        depthWrite={!transparent}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function AnimatedDisk({
  radius,
  solid,
  flat,
  progress,
  color,
  transparent,
  selected,
}: {
  radius: number
  solid: Transform
  flat: Transform
  progress: React.RefObject<number>
  color: string
  transparent: boolean
  selected: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  useAnimatedTransform(ref, progress, solid, flat)
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshPhysicalMaterial
          color={color}
          emissive={selected ? '#6b3b16' : '#000000'}
          emissiveIntensity={selected ? 0.14 : 0}
          roughness={0.38}
          transparent={transparent}
          opacity={transparent ? 0.38 : 0.94}
          depthWrite={!transparent}
          side={THREE.DoubleSide}
        />
        <Edges color={selected ? '#9a4e12' : '#6f5a48'} lineWidth={selected ? 2.3 : 1.35} />
      </mesh>
    </group>
  )
}

function CurvedModel({
  dimensions,
  object,
  selected,
  progress,
}: {
  dimensions: SceneDimensions
  object: GeometryObject
  selected: boolean
  progress: React.RefObject<number>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { radius, y: height } = dimensions
  const color = SHAPE_COLORS[object.type]
  const isCylinder = object.type === 'cylinder'
  const data = useMemo(
    () => (isCylinder ? createCylinderSurface(radius, height) : createConeSurface(radius, height)),
    [height, isCylinder, radius],
  )
  const slant = Math.hypot(radius, height)
  const coneApexY = (slant + radius) / 2
  const unfoldLift = isCylinder
    ? radius * 2 + 0.45
    : Math.max(0, (slant + radius * 3 - height) / 2 + 0.45)

  useFrame(() => {
    if (groupRef.current) groupRef.current.position.y = progress.current * unfoldLift
  })

  return (
    <group ref={groupRef}>
      <MorphSurface
        data={data}
        progress={progress}
        color={color}
        transparent={object.transparent}
        selected={selected}
      />
      {isCylinder ? (
        <>
          <AnimatedDisk
            radius={radius}
            solid={{ position: [0, height / 2, 0], rotation: [Math.PI / 2, 0, 0] }}
            flat={{ position: [0, height / 2 + radius, 0], rotation: [0, 0, 0] }}
            progress={progress}
            color={color}
            transparent={object.transparent}
            selected={selected}
          />
          <AnimatedDisk
            radius={radius}
            solid={{ position: [0, -height / 2, 0], rotation: [-Math.PI / 2, 0, 0] }}
            flat={{ position: [0, -height / 2 - radius, 0], rotation: [0, 0, 0] }}
            progress={progress}
            color={color}
            transparent={object.transparent}
            selected={selected}
          />
        </>
      ) : (
        <AnimatedDisk
          radius={radius}
          solid={{ position: [0, -height / 2, 0], rotation: [-Math.PI / 2, 0, 0] }}
          flat={{ position: [0, coneApexY - slant - radius, 0], rotation: [0, 0, 0] }}
          progress={progress}
          color={color}
          transparent={object.transparent}
          selected={selected}
        />
      )}
      {object.unfolded
        ? <UnfoldedDimensionGuides object={object} dimensions={dimensions} />
        : <DimensionGuides object={object} dimensions={dimensions} />}
    </group>
  )
}

export function GeometryModel({
  object,
  selected,
  dragging,
  onSelect,
  onMoveStart,
  onMove,
  onMoveEnd,
  onHover,
}: GeometryModelProps) {
  const { camera, size } = useThree()
  const dimensions = sceneDimensions(object)
  const progress = useUnfoldProgress(object.unfolded)
  const dragState = useRef({
    pointerX: 0,
    pointerY: 0,
    start: new THREE.Vector3(),
    right: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    worldUnitsPerPixel: 0.01,
  })

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== THREE.MOUSE.LEFT) return
    event.stopPropagation()
    onSelect(object.id)
    const state = dragState.current
    const nativeEvent = event.nativeEvent
    const objectCenter = new THREE.Vector3(object.position[0], dimensions.y / 2, object.position[2])
    const distance = camera.position.distanceTo(objectCenter)
    const visibleHeight = camera instanceof THREE.PerspectiveCamera
      ? 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance
      : (camera instanceof THREE.OrthographicCamera
          ? (camera.top - camera.bottom) / camera.zoom
          : distance)

    state.pointerX = nativeEvent.clientX
    state.pointerY = nativeEvent.clientY
    state.start.set(object.position[0], 0, object.position[2])
    state.right.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize()
    camera.getWorldDirection(state.forward)
    state.forward.setY(0).normalize()
    state.worldUnitsPerPixel = visibleHeight / Math.max(size.height, 1)
    const captureTarget = event.nativeEvent.target as Element | null
    captureTarget?.setPointerCapture(event.pointerId)
    onMoveStart(object.id)
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging) return
    event.stopPropagation()
    const state = dragState.current
    const deltaX = event.nativeEvent.clientX - state.pointerX
    const deltaY = event.nativeEvent.clientY - state.pointerY
    const displacement = state.right.clone().multiplyScalar(deltaX * state.worldUnitsPerPixel)
      .addScaledVector(state.forward, -deltaY * state.worldUnitsPerPixel)
    const nextX = THREE.MathUtils.clamp(state.start.x + displacement.x, -16, 16)
    const nextZ = THREE.MathUtils.clamp(state.start.z + displacement.z, -16, 16)
    onMove(object.id, [
      nextX,
      0,
      nextZ,
    ])
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging || event.button !== THREE.MOUSE.LEFT) return
    event.stopPropagation()
    const captureTarget = event.nativeEvent.target as Element | null
    if (captureTarget?.hasPointerCapture(event.pointerId)) {
      captureTarget.releasePointerCapture(event.pointerId)
    }
    onMoveEnd()
  }

  return (
    <group
      position={[object.position[0], dimensions.y / 2 + 0.03, object.position[2]]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={onMoveEnd}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      {object.type === 'cube' || object.type === 'cuboid' ? (
        <BoxModel dimensions={dimensions} object={object} selected={selected} progress={progress} />
      ) : (
        <CurvedModel dimensions={dimensions} object={object} selected={selected} progress={progress} />
      )}
    </group>
  )
}
