import { describe, it, expect } from 'vitest'
import { buildControls, syncControls } from '../src/ui/controls'
import type { ParamDef } from '../src/modes/mode'
import type { Params } from '../src/engine/types'

const defs: ParamDef[] = [
  { kind: 'range', key: 'radius', label: 'Radius', min: 0, max: 100, step: 1, def: 50 },
  { kind: 'checkbox', key: 'grid', label: 'Grid', def: false },
]

describe('buildControls', () => {
  it('renders one input per def with defaults', () => {
    const root = document.createElement('div')
    const values: Params = { radius: 50, grid: false }
    buildControls(root, defs, values, () => {})
    const inputs = root.querySelectorAll('input')
    expect(inputs).toHaveLength(2)
    expect((inputs[0] as HTMLInputElement).value).toBe('50')
    expect((inputs[1] as HTMLInputElement).checked).toBe(false)
  })

  it('writes values and fires onChange on input', () => {
    const root = document.createElement('div')
    const values: Params = { radius: 50, grid: false }
    let changes = 0
    buildControls(root, defs, values, () => changes++)
    const range = root.querySelector('input[type=range]') as HTMLInputElement
    range.value = '75'
    range.dispatchEvent(new Event('input'))
    const box = root.querySelector('input[type=checkbox]') as HTMLInputElement
    box.checked = true
    box.dispatchEvent(new Event('input'))
    expect(values.radius).toBe(75)
    expect(values.grid).toBe(true)
    expect(changes).toBe(2)
  })

  it('syncControls pushes values back into inputs', () => {
    const root = document.createElement('div')
    const values: Params = { radius: 50, grid: false }
    buildControls(root, defs, values, () => {})
    values.radius = 90
    values.grid = true
    syncControls(root, values)
    expect((root.querySelector('input[type=range]') as HTMLInputElement).value).toBe('90')
    expect((root.querySelector('input[type=checkbox]') as HTMLInputElement).checked).toBe(true)
  })
})
