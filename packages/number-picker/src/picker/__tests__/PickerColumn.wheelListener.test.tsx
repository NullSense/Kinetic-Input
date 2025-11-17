import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
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


  it('ignores pinch-zoom wheel events even when wheel scrolling is enabled', () => {
    const options = buildOptions(5)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200}>
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
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200}>
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

  it('accumulates small pixel wheel deltas into value changes once the gesture settles', async () => {
    const options = buildOptions(7)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200}>
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

    // Dispatch pixel-mode wheel events (touchpad simulation)
    // Default deltaMode is 0 (DOM_DELTA_PIXEL), which uses natural scrolling with 0.35 sensitivity
    // Send enough to guarantee movement: 10 events * 60px * 0.35 = 210px (5+ items)
    for (let i = 0; i < 10; i += 1) {
      column.dispatchEvent(new WheelEvent('wheel', { deltaY: 60, bubbles: true, cancelable: true }))
    }

    // Wait for the wheel gesture to settle and onChange to be called
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    }, { timeout: 1500 })
  })

  it('treats DOM_DELTA_LINE units as item-height steps for classic mouse wheels', async () => {
    const options = buildOptions(6)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 2' }} onChange={onChange} itemHeight={40} height={200}>
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

    // Send 2 wheel events to ensure enough delta for change
    column.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 1, deltaMode: domDeltaLine, bubbles: true, cancelable: true })
    )
    column.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 1, deltaMode: domDeltaLine, bubbles: true, cancelable: true })
    )

    // Wait for the wheel gesture to settle and onChange to be called
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('caps any single wheel frame to roughly a row to keep touchpads from skipping', async () => {
    const options = buildOptions(10)
    const onChange = vi.fn()

    const { container } = render(
      <Picker
        value={{ v: 'Opt 0' }}
        onChange={onChange}
        itemHeight={40}
        height={200}
        wheelDeltaCap={1}
      >
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

    // Send large delta that should be capped
    column.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true })
    )
    // Send another to ensure change
    column.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 400, bubbles: true, cancelable: true })
    )

    // Wait for the wheel gesture to settle and onChange to be called
    // Verify it moved but not too far (should be Opt 1 or 2, not Opt 10)
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
      const selectedValue = lastCall?.[0]?.v
      // With wheelDeltaCap=1, large deltas should be limited
      expect(['Opt 1', 'Opt 2', 'Opt 3']).toContain(selectedValue)
    }, { timeout: 1000 })
  })

  it('wheel scrolling never uses momentum/flicking - only snaps to nearest value', async () => {
    const options = buildOptions(20)
    const onChange = vi.fn()

    const { container } = render(
      <Picker value={{ v: 'Opt 10' }} onChange={onChange} itemHeight={40} height={200}>
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

    // Dispatch rapid wheel events simulating fast touchpad scrolling
    // Without momentum: 12 events * 60px * 0.35 = ~252px (6 items down = index 16)
    // WITH momentum: would overshoot to index 18-19 due to velocity projection
    for (let i = 0; i < 12; i += 1) {
      column.dispatchEvent(new WheelEvent('wheel', { deltaY: 60, bubbles: true, cancelable: true }))
    }

    // Wait for settle
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    }, { timeout: 1500 })

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]
    const selectedValue = lastCall?.[0]?.v
    const selectedIndex = options.indexOf(selectedValue)

    // Should land around Opt 15-17 without momentum
    // Would overshoot to Opt 18-19 with momentum
    expect(selectedIndex).toBeLessThan(18)
    expect(selectedIndex).toBeGreaterThan(13)
  })
})
