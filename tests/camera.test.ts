import { describe, it, expect } from 'vitest'
import { defaultCamera, project, rotate } from '../src/engine/camera'

describe('camera', () => {
  it('projects the origin to canvas center with zero depth', () => {
    const p = project({ x: 0, y: 0, z: 0 }, defaultCamera(), 400, 300)
    expect(p.x).toBeCloseTo(400)
    expect(p.y).toBeCloseTo(300)
    expect(p.depth).toBeCloseTo(0)
  })

  it('projects a z=0 point 1:1 at zoom 1', () => {
    const p = project({ x: 100, y: -50, z: 0 }, defaultCamera(), 400, 300)
    expect(p.x).toBeCloseTo(500)
    expect(p.y).toBeCloseTo(250)
  })

  it('shrinks points further from the camera', () => {
    const cam = defaultCamera()
    const near = project({ x: 100, y: 0, z: -400 }, cam, 0, 0)
    const far = project({ x: 100, y: 0, z: 400 }, cam, 0, 0)
    expect(Math.abs(near.x)).toBeGreaterThan(100)
    expect(Math.abs(far.x)).toBeLessThan(100)
    expect(far.depth).toBeGreaterThan(near.depth)
  })

  it('rotates around Y', () => {
    const cam = { ...defaultCamera(), rotY: Math.PI / 2 }
    const r = rotate({ x: 100, y: 0, z: 0 }, cam)
    expect(r.x).toBeCloseTo(0)
    expect(r.z).toBeCloseTo(-100)
  })

  it('scales with zoom', () => {
    const cam = { ...defaultCamera(), zoom: 2 }
    const p = project({ x: 100, y: 0, z: 0 }, cam, 0, 0)
    expect(p.x).toBeCloseTo(200)
  })
})
