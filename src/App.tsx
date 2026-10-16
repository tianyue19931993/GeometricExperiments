import { useMemo, useState } from 'react'
import './App.css'
import { ShapeGlyph } from './ShapeGlyph'
import { Workbench } from './Workbench'
import {
  changeObjectUnit,
  createGeometryObject,
  DIMENSION_KEYS,
  effectiveValue,
  hasUnknownDimensions,
  roundValue,
} from './model'
import type { DimensionKey, GeometryObject, ShapeType, Unit, Vec3Tuple } from './types'
import { SHAPE_LABELS, UNIT_LABELS } from './types'

const SHAPES: ShapeType[] = ['cube', 'cuboid', 'cylinder', 'cone']

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  edge: '棱长',
  length: '长',
  width: '宽',
  height: '高',
  radius: '半径',
}

interface DimensionControlProps {
  object: GeometryObject
  dimensionKey: DimensionKey
  onInput: (value: string) => void
  onSlider: (value: number) => void
}

function DimensionControl({ object, dimensionKey, onInput, onSlider }: DimensionControlProps) {
  const storedValue = object.dimensions[dimensionKey]
  const isDiameter = dimensionKey === 'radius' && object.radialMode === 'diameter'
  const label = isDiameter ? '直径' : DIMENSION_LABELS[dimensionKey]
  const multiplier = isDiameter ? 2 : 1
  const displayedValue = storedValue === null ? '' : roundValue(storedValue * multiplier)
  const sliderValue = Math.min(20, Math.max(0.5, effectiveValue(object, dimensionKey) * multiplier))

  return (
    <div className="dimension-control">
      <div className="dimension-heading">
        <label htmlFor={`${object.id}-${dimensionKey}`}>{label}</label>
        <span className={storedValue === null ? 'unknown-badge' : 'known-badge'}>
          {storedValue === null ? '未知' : '已知'}
        </span>
      </div>
      <div className="dimension-input-row">
        <input
          id={`${object.id}-${dimensionKey}`}
          type="number"
          min="0.001"
          max="100000"
          step="0.1"
          inputMode="decimal"
          value={displayedValue}
          placeholder="?"
          aria-label={`${label}，单位${object.unit}`}
          onChange={(event) => onInput(event.target.value)}
        />
        <span>{object.unit}</span>
      </div>
      <input
        className="dimension-range"
        type="range"
        min="0.5"
        max="20"
        step="0.1"
        value={sliderValue}
        aria-label={`${label}滑条`}
        onChange={(event) => onSlider(Number(event.target.value))}
      />
      <div className="range-scale" aria-hidden="true">
        <span>0.5</span>
        <span>20 {object.unit}</span>
      </div>
    </div>
  )
}

function App() {
  const [objects, setObjects] = useState<GeometryObject[]>(() => [createGeometryObject('cube', 0)])
  const [selectedId, setSelectedId] = useState<string | null>(() => null)
  const [resetKey, setResetKey] = useState(0)

  const selectedObject = useMemo(
    () => objects.find((object) => object.id === selectedId) ?? objects[0] ?? null,
    [objects, selectedId],
  )
  const effectiveSelectedId = selectedObject?.id ?? null

  const updateObject = (id: string, updater: (object: GeometryObject) => GeometryObject) => {
    setObjects((current) => current.map((object) => (object.id === id ? updater(object) : object)))
  }

  const addObject = (type: ShapeType) => {
    const next = createGeometryObject(type, objects.length)
    setObjects((current) => [...current, next])
    setSelectedId(next.id)
  }

  const deleteObject = (id: string) => {
    setObjects((current) => current.filter((object) => object.id !== id))
    if (effectiveSelectedId === id) setSelectedId(null)
  }

  const setDimensionFromInput = (object: GeometryObject, key: DimensionKey, raw: string) => {
    updateObject(object.id, (current) => {
      const dimensions = { ...current.dimensions }
      if (raw.trim() === '') {
        dimensions[key] = null
      } else {
        const parsed = Number(raw)
        if (!Number.isFinite(parsed) || parsed <= 0) return current
        dimensions[key] = roundValue(key === 'radius' && current.radialMode === 'diameter' ? parsed / 2 : parsed)
      }
      return { ...current, dimensions }
    })
  }

  const setDimensionFromSlider = (object: GeometryObject, key: DimensionKey, rawValue: number) => {
    updateObject(object.id, (current) => ({
      ...current,
      dimensions: {
        ...current.dimensions,
        [key]: roundValue(key === 'radius' && current.radialMode === 'diameter' ? rawValue / 2 : rawValue),
      },
    }))
  }

  const moveObject = (id: string, position: Vec3Tuple) => {
    updateObject(id, (object) => ({ ...object, position }))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="brand-copy">
          <h1>几何探索实验室</h1>
          <p>亲手调整 · 自由观察 · 发现立体图形的秘密</p>
        </div>
      </header>

      <section className="workspace">
        <aside className="panel library-panel">
          <div className="panel-heading">
            <span className="eyebrow">选择图形</span>
            <h2>几何体库</h2>
            <p>点击图形，添加到实验台</p>
          </div>
          <div className="shape-library">
            {SHAPES.map((type) => (
              <button className={`shape-card shape-${type}`} key={type} onClick={() => addObject(type)}>
                <span className="shape-glyph"><ShapeGlyph type={type} /></span>
                <span>{SHAPE_LABELS[type]}</span>
                <small>点击添加</small>
              </button>
            ))}
          </div>

          <div className="object-list-heading">
            <div><span>实验台对象</span><b>{objects.length}</b></div>
            <small>选择对象后可独立调整</small>
          </div>
          <div className="object-list">
            {objects.map((object) => (
              <div
                key={object.id}
                className={`object-row ${object.id === effectiveSelectedId ? 'is-selected' : ''}`}
              >
                <button className="object-select" onClick={() => setSelectedId(object.id)}>
                  <span className={`object-color object-color-${object.type}`} />
                  <span><strong>{object.name}</strong><small>{object.unfolded ? '展开观察中' : '立体模型'}</small></span>
                </button>
                <button className="delete-button" aria-label={`删除${object.name}`} onClick={() => deleteObject(object.id)}>×</button>
              </div>
            ))}
            {objects.length === 0 && <p className="list-empty">还没有对象</p>}
          </div>
        </aside>

        <section className="stage-panel">
          <div className="stage-toolbar">
            <div className="stage-title">
              <span className="eyebrow">图形展示</span>
              <strong>3D 实验台</strong>
            </div>
            <div className="tool-group" role="group" aria-label="实验台工具">
              <button onClick={() => setResetKey((value) => value + 1)} title="回到画布中心点">
                <span>⌂</span> 重置观察
              </button>
            </div>
          </div>
          <Workbench
            objects={objects}
            selectedId={effectiveSelectedId}
            resetKey={resetKey}
            onSelect={setSelectedId}
            onMove={moveObject}
          />
        </section>

        <aside className="panel properties-panel">
          <div className="panel-heading">
            <span className="eyebrow">调整图形尺寸</span>
            <h2>几何体属性</h2>
          </div>

          {selectedObject ? (
            <div className="properties-content">
              <div className="selected-object-card">
                <span className={`selected-glyph shape-${selectedObject.type}`}><ShapeGlyph type={selectedObject.type} /></span>
                <div><strong>{selectedObject.name}</strong><small>{SHAPE_LABELS[selectedObject.type]} · 独立对象</small></div>
              </div>

              <div className="property-section">
                <div className="property-section-title"><strong>尺寸设置</strong><span>允许留空</span></div>

                {(selectedObject.type === 'cylinder' || selectedObject.type === 'cone') && (
                  <div className="segmented-control" aria-label="底面尺寸输入方式">
                    <button
                      className={selectedObject.radialMode === 'radius' ? 'is-active' : ''}
                      onClick={() => updateObject(selectedObject.id, (object) => ({ ...object, radialMode: 'radius' }))}
                    >半径</button>
                    <button
                      className={selectedObject.radialMode === 'diameter' ? 'is-active' : ''}
                      onClick={() => updateObject(selectedObject.id, (object) => ({ ...object, radialMode: 'diameter' }))}
                    >直径</button>
                  </div>
                )}

                {DIMENSION_KEYS[selectedObject.type].map((key) => (
                  <DimensionControl
                    key={key}
                    object={selectedObject}
                    dimensionKey={key}
                    onInput={(value) => setDimensionFromInput(selectedObject, key, value)}
                    onSlider={(value) => setDimensionFromSlider(selectedObject, key, value)}
                  />
                ))}

                <label className="unit-select-label" htmlFor="unit-select">尺寸单位</label>
                <select
                  id="unit-select"
                  value={selectedObject.unit}
                  onChange={(event) => updateObject(
                    selectedObject.id,
                    (object) => changeObjectUnit(object, event.target.value as Unit),
                  )}
                >
                  {(Object.keys(UNIT_LABELS) as Unit[]).map((unit) => (
                    <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>
                  ))}
                </select>
              </div>

              {hasUnknownDimensions(selectedObject) && (
                <div className="model-notice">
                  <span>?</span>
                  <div><strong>示意模型，部分尺寸未知</strong><small>空白尺寸用合理比例绘制，不会当作题目已知条件。</small></div>
                </div>
              )}

              <div className="property-section exploration-section">
                <button
                  className={`unfold-button ${selectedObject.unfolded ? 'is-unfolded' : ''}`}
                  onClick={() => updateObject(
                    selectedObject.id,
                    (object) => ({ ...object, unfolded: !object.unfolded }),
                  )}
                >
                  <span>{selectedObject.unfolded ? '⬡' : '⌁'}</span>
                  <span><strong>{selectedObject.unfolded ? '恢复立体' : '一键展开'}</strong><small>{selectedObject.unfolded ? '折叠回原来的立体模型' : '在三维空间查看展开图'}</small></span>
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <span>◇</span><strong>请选择一个几何体</strong><p>从左侧添加或选择对象后，可以在这里调整尺寸。</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

export default App
