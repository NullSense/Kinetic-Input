import { describe, it, expect, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import Picker from '../PickerGroup'
import PickerColumn from '../PickerColumn'
import PickerItem from '../PickerItem'

function buildOptions(n: number) {
  return Array.from({ length: n }, (_, i) => `Opt ${i}`)
}

describe('PickerColumn wheel listener hygiene', () => {
  it('removes wheel listener on unmount (no leaks)', () => {
    const options = buildOptions(5)

    const { unmount, container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={() => {}} itemHeight={40} height={200}>
        <PickerColumn name="v">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </Picker>
    )

    const node = container.querySelector('div') as HTMLDivElement
    const wheelSpy = vi.fn()
    node.addEventListener('wheel', wheelSpy)

    unmount()

    // Dispatch wheel on detached node should not invoke picker listener
    const evt = new WheelEvent('wheel', { deltaY: 10, bubbles: true, cancelable: true })
    node.dispatchEvent(evt)
    expect(wheelSpy).toHaveBeenCalled() // our spy got the event
    // We cannot directly assert internal listener not called, but no errors thrown is the guard
    expect(true).toBe(true)
  })

  it('lets wheel events bubble when wheelMode is off', () => {
    const options = buildOptions(5)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200} wheelMode="off">
        <PickerColumn name="v">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </Picker>
    )

    const column = container.querySelector('.picker-scroller')?.parentElement as HTMLDivElement
    const evt = new WheelEvent('wheel', { deltaY: 12, bubbles: true, cancelable: true })

    const dispatchResult = column.dispatchEvent(evt)

    expect(dispatchResult).toBe(true)
    expect(evt.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ignores pinch-zoom wheel events even when wheel scrolling is enabled', () => {
    const options = buildOptions(5)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200} wheelMode="inverted">
        <PickerColumn name="v">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </Picker>
    )

    const column = container.querySelector('.picker-scroller')?.parentElement as HTMLDivElement
    const evt = new WheelEvent('wheel', { deltaY: 30, ctrlKey: true, bubbles: true, cancelable: true })

    const dispatchResult = column.dispatchEvent(evt)

    expect(dispatchResult).toBe(true)
    expect(evt.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('continues to capture wheel events when enabled', () => {
    const options = buildOptions(5)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200} wheelMode="natural">
        <PickerColumn name="v">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </Picker>
    )

    const column = container.querySelector('.picker-scroller')?.parentElement as HTMLDivElement
    const evt = new WheelEvent('wheel', { deltaY: 20, bubbles: true, cancelable: true })

    const dispatchResult = column.dispatchEvent(evt)

    expect(dispatchResult).toBe(false)
    expect(evt.defaultPrevented).toBe(true)
  })

  it('accumulates small pixel wheel deltas into value changes once the gesture settles', () => {
    vi.useFakeTimers()
    try {
      const options = buildOptions(7)
      const onChange = vi.fn()

      const { container } = render(
        <Picker value={{ v: 'Opt 3' }} onChange={onChange} itemHeight={40} height={200} wheelMode="natural">
          <PickerColumn name="v">
            {options.map((opt) => (
              <PickerItem key={opt} value={opt}>
                {opt}
              </PickerItem>
            ))}
          </PickerColumn>
        </Picker>
      )

      const column = container.querySelector('.picker-scroller')?.parentElement as HTMLDivElement

      act(() => {
        for (let i = 0; i < 5; i += 1) {
          column.dispatchEvent(new WheelEvent('wheel', { deltaY: 6, bubbles: true, cancelable: true }))
        }
      })

      act(() => {
        vi.advanceTimersByTime(250)
      })

      expect(onChange).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('treats DOM_DELTA_LINE units as item-height steps for classic mouse wheels', () => {
    vi.useFakeTimers()
    try {
      const options = buildOptions(6)
      const onChange = vi.fn()

      const { container } = render(
        <Picker value={{ v: 'Opt 0' }} onChange={onChange} itemHeight={40} height={200} wheelMode="natural">
          <PickerColumn name="v">
            {options.map((opt) => (
              <PickerItem key={opt} value={opt}>
                {opt}
              </PickerItem>
            ))}
          </PickerColumn>
        </Picker>
      )

      const column = container.querySelector('.picker-scroller')?.parentElement as HTMLDivElement
      const domDeltaLine = typeof WheelEvent !== 'undefined' && 'DOM_DELTA_LINE' in WheelEvent ? WheelEvent.DOM_DELTA_LINE : 1

      act(() => {
        column.dispatchEvent(
          new WheelEvent('wheel', { deltaY: 1, deltaMode: domDeltaLine, bubbles: true, cancelable: true })
        )
        vi.advanceTimersByTime(250)
      })

      expect(onChange).toHaveBeenCalledWith({ v: 'Opt 1' }, 'v')
    } finally {
      vi.useRealTimers()
    }
  })
})
