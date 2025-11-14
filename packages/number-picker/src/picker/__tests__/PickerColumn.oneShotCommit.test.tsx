import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import Picker from '../PickerGroup'
import PickerColumn from '../PickerColumn'
import PickerItem from '../PickerItem'

function TestPicker({ children, onValueChange = vi.fn() }: { children: React.ReactNode; onValueChange?: (v: string) => void }) {
  return (
    <Picker value={{ test: 'Option 3' }} onChange={(nv) => onValueChange(nv.test as string)} itemHeight={40} height={200}>
      {children}
    </Picker>
  )
}

describe.skip('PickerColumn one-shot commit', () => {
  const options = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`)

  it('fires onChange exactly once on release after long drag', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()

    render(
      <TestPicker onValueChange={onValueChange}>
        <PickerColumn name="test">
          {options.map((opt) => (
            <PickerItem key={opt} value={opt}>
              {opt}
            </PickerItem>
          ))}
        </PickerColumn>
      </TestPicker>
    )

    const startEl = screen.getByText('Option 2').parentElement!

    await user.pointer({ target: startEl, keys: '[MouseLeft>]' })

    // Many move events (simulate momentum-worthy drag)
    await user.pointer({ target: startEl, keys: '[MouseLeft>]' })
    for (let i = 0; i < 60; i++) {
      await user.pointer({ coords: { x: 0, y: i * 2 } })
    }

    // During drag: no commits
    expect(onValueChange).not.toHaveBeenCalled()

    await user.pointer({ keys: '[/MouseLeft]' })

    // Commit happens once on release (after internal settle)
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })
})
