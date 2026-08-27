import type { ParamDef } from '../modes/mode'
import type { Params } from '../engine/types'

export function buildControls(root: HTMLElement, defs: ParamDef[], values: Params, onChange: () => void): void {
  root.innerHTML = ''
  for (const d of defs) {
    const row = document.createElement('label')
    row.className = 'ctl'
    const name = document.createElement('span')
    name.className = 'ctl-name'
    name.textContent = d.label
    row.appendChild(name)
    const input = document.createElement('input')
    input.dataset.key = d.key
    if (d.kind === 'range') {
      input.type = 'range'
      input.min = String(d.min)
      input.max = String(d.max)
      input.step = String(d.step)
      input.value = String(values[d.key] ?? d.def)
      const val = document.createElement('span')
      val.className = 'ctl-val'
      val.textContent = input.value
      input.addEventListener('input', () => {
        values[d.key] = Number(input.value)
        val.textContent = input.value
        onChange()
      })
      row.appendChild(input)
      row.appendChild(val)
    } else {
      input.type = 'checkbox'
      input.checked = Boolean(values[d.key] ?? d.def)
      input.addEventListener('input', () => {
        values[d.key] = input.checked
        onChange()
      })
      row.appendChild(input)
    }
    root.appendChild(row)
  }
}

export function syncControls(root: HTMLElement, values: Params): void {
  for (const input of root.querySelectorAll<HTMLInputElement>('input[data-key]')) {
    const key = input.dataset.key!
    if (!(key in values)) continue
    if (input.type === 'checkbox') input.checked = Boolean(values[key])
    else {
      input.value = String(values[key])
      const val = input.parentElement?.querySelector('.ctl-val')
      if (val) val.textContent = String(values[key])
    }
  }
}
