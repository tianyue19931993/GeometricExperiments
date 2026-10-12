import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { GeometryModel } from './GeometryModels'
import { sceneDimensions } from './model'
import type { GeometryObject, Vec3Tuple } from './types'

interface WorkbenchProps {
  objects: GeometryObject[]
  selectedId: string | null
  resetKey: number
  onSelect: (id: string | null) => void
  onMove: (id: string, position: Vec3Tuple) => void
}
function CameraController({
  controls,
  resetKey,
  selectedObject,
}: {
  controls: React.RefObject<OrbitControlsImpl | null>
  resetKey: number
  selectedObject: GeometryObject | null
}) {
  const { camera } = useThree()
  const selectedObjectRef = useRef(selectedObject)
  const selectedObjectId = selectedObject?.id ?? null
  const selectedObjectUnfolded = selectedObject?.unfolded ?? false

  useEffect(() => {
    selectedObjectRef.current = selectedObject
  }, [selectedObject])

  useEffect(() => {
    camera.position.set(9, 7, 11)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    controls.current?.target.set(0, 0, 0)
    controls.current?.update()
  }, [camera, controls, resetKey])

  useEffect(() => {
    const object = selectedObjectRef.current
    if (!object?.unfolded) return
    const dimensions = sceneDimensions(object)
    const boxShape = object.type === 'cube' || object.type === 'cuboid'
    const targetY = boxShape
      ? (dimensions.y + dimensions.z * 2) / 2 + 0.45
      : object.type === 'cylinder'
        ? (dimensions.y + dimensions.radius * 4) / 2 + 0.1
        : (Math.hypot(dimensions.radius, dimensions.y) + dimensions.radius * 2) / 2 + 0.1
    const extent = boxShape
      ? Math.max(dimensions.x * 2 + dimensions.z * 2, dimensions.y + dimensions.z * 2)
      : object.type === 'cylinder'
        ? Math.max(Math.PI * 2 * dimensions.radius, dimensions.y + dimensions.radius * 2)
        : Math.hypot(dimensions.radius, dimensions.y) * 2 + dimensions.radius
    const distance = Math.max(7, extent * 1.6)
    const target = new THREE.Vector3(object.position[0], targetY, object.position[2])
    const frame = window.requestAnimationFrame(() => {
      camera.position.set(target.x, target.y + distance * 0.32, target.z + distance)
      camera.lookAt(target)
      controls.current?.target.copy(target)
      controls.current?.update()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [camera, controls, selectedObjectId, selectedObjectUnfolded])
  return null
}

export function Workbench({ objects, selectedId, resetKey, onSelect, onMove }: WorkbenchProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const selectedObject = objects.find((object) => object.id === selectedId) ?? null

  useEffect(() => {
    const finishDrag = () => {
      if (controls.current) controls.current.enabled = true
      setDraggingId(null)
    }
    window.addEventListener('pointerup', finishDrag)
    return () => window.removeEventListener('pointerup', finishDrag)
  }, [])

  const finishDragging = () => {
    if (controls.current) controls.current.enabled = true
    setDraggingId(null)
  }

  return (
    <div
      className={`workbench-canvas ${hoveredId ? 'is-hovering-object' : ''} ${draggingId ? 'is-dragging-object' : ''}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Canvas
        shadows="basic"
        dpr={[1, 1.75]}
        camera={{ position: [9, 7, 11], fov: 42, near: 0.1, far: 120 }}
        onPointerMissed={() => onSelect(null)}
      >
        <color attach="background" args={['#f4f8fb']} />
        <fog attach="fog" args={['#f4f8fb', 18, 44]} />
        <hemisphereLight args={['#ffffff', '#b8c7d8', 2.1]} />
        <directionalLight
          castShadow
          position={[7, 12, 8]}
          intensity={2.8}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
        />
        <directionalLight position={[-8, 6, -5]} intensity={0.85} color="#d7e6ff" />

        {objects.map((object) => (
          <GeometryModel
            key={object.id}
            object={object}
            selected={object.id === selectedId}
            dragging={object.id === draggingId}
            onSelect={(id) => onSelect(id)}
            onHover={(hovered) => setHoveredId(hovered ? object.id : null)}
            onMoveStart={(id) => {
              if (controls.current) controls.current.enabled = false
              setDraggingId(id)
            }}
            onMove={onMove}
            onMoveEnd={finishDragging}
          />
        ))}

        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial
            color="#dce8f0"
            roughness={0.92}
            transparent
            opacity={0.34}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <gridHelper args={[40, 40, '#b9c9d8', '#dbe5ec']} position={[0, 0.012, 0]} />
        {!objects.some((object) => object.unfolded) && (
          <ContactShadows position={[0, 0.018, 0]} opacity={0.25} scale={28} blur={2.5} far={10} />
        )}

        <OrbitControls
          ref={controls}
          enabled={!draggingId}
          makeDefault
          enableDamping
          enablePan
          screenSpacePanning
          dampingFactor={0.08}
          minDistance={5.5}
          maxDistance={30}
          maxPolarAngle={(Math.PI / 2) * 0.96}
          target={[0, 0, 0]}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />
        <CameraController controls={controls} resetKey={resetKey} selectedObject={selectedObject} />
      </Canvas>

      {objects.length === 0 && (
        <div className="empty-stage" role="status">
          <span className="empty-orbit">◎</span>
          <strong>实验台还是空的</strong>
          <small>从左侧选择一个几何体，开始动手探索吧</small>
        </div>
      )}

      <div className="stage-hint">
        拖动几何体移动 · 左键旋转 · 右键平移 · 滚轮缩放
      </div>
    </div>
  )
}
