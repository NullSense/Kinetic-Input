import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePickerStateMachine, PickerContext, CloseContext } from '../usePickerStateMachine.xstate'

/**
 * XState machine tests - verify migration from manual state machine
 * Tests match the original implementation tests to ensure behavioral equivalence
 */
describe('usePickerStateMachine (XState)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Initial state', () => {
    it('starts in closed state', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: false,
          isControlled: false,
          onRequestClose,
        })
      )

      expect(result.current.state).toBe('closed')
      expect(result.current.isInteracting).toBe(false)
      expect(result.current.isSettling).toBe(false)
      expect(result.current.shouldBlockClose).toBe(false)
    })
  })

  describe('State transitions', () => {
    it('transitions from closed → interacting on pointer down', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
      })

      expect(result.current.state).toBe('interacting')
      expect(result.current.isInteracting).toBe(true)
      expect(result.current.shouldBlockClose).toBe(true)
    })

    it('transitions from interacting → settling on pointer up', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
      })
      expect(result.current.state).toBe('interacting')

      act(() => {
        result.current.handlePointerUp()
      })

      expect(result.current.state).toBe('settling')
      expect(result.current.isSettling).toBe(true)
      expect(result.current.shouldBlockClose).toBe(true) // Still blocked!
    })

    it('transitions from settling → idle after momentum ends (multi-gesture)', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          idleTimeout: 4000,
          settleGracePeriod: 150,
        })
      )

      // Multi-gesture: pointer down while already open
      act(() => {
        result.current.handlePointerDown() // First gesture
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
        result.current.handlePointerDown() // Second gesture = multi-gesture
        result.current.handlePointerUp()
      })

      act(() => {
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')
      expect(result.current.shouldBlockClose).toBe(false)

      // onRequestClose NOT called yet (waits for delay)
      expect(onRequestClose).not.toHaveBeenCalled()

      // Should use idle timeout (multi-gesture), not grace period
      act(() => vi.advanceTimersByTime(149))
      expect(result.current.state).toBe('idle') // Still open
      expect(onRequestClose).not.toHaveBeenCalled()

      // After idle timeout, onRequestClose fires with reason='idle'
      act(() => vi.advanceTimersByTime(4000 - 149))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledTimes(1)
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'idle',
        atBoundary: false,
      })
    })

    it('transitions from settling → idle → closed after momentum ends (single gesture)', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      // Single gesture from start
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
      })

      act(() => {
        result.current.handleMomentumEnd(false)
      })

      // Should be in idle state, onRequestClose NOT called yet (waits for grace period)
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // After grace period, onRequestClose fires and closes
      act(() => {
        act(() => vi.advanceTimersByTime(150))
      })
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })
  })

  describe('Timer blocking during interaction', () => {
    it('blocks ALL close attempts while pointer is down', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
      })

      expect(result.current.shouldBlockClose).toBe(true)

      // Even after 10 seconds
      act(() => vi.advanceTimersByTime(10000))
      expect(onRequestClose).not.toHaveBeenCalled()
      expect(result.current.state).toBe('interacting')
    })

    it('blocks close while settling (waiting for momentum)', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
      })

      expect(result.current.state).toBe('settling')
      expect(result.current.shouldBlockClose).toBe(true)

      // Timer doesn't start until momentum ends (watchdog fires at 1000ms)
      act(() => vi.advanceTimersByTime(999))
      expect(onRequestClose).not.toHaveBeenCalled()
    })

    it('holds picker open while pointer is down past boundary', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
      })

      // User drags past boundary while pointer down
      // State machine should NOT close
      act(() => vi.advanceTimersByTime(5000))
      expect(result.current.shouldBlockClose).toBe(true)
      expect(onRequestClose).not.toHaveBeenCalled()

      // Only after release + momentum end
      act(() => {
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(true) // at boundary
      })

      // State idle, onRequestClose not called yet
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // After grace period, onRequestClose fires with atBoundary: true
      act(() => vi.advanceTimersByTime(150)) // grace period
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: true,
      })
    })
  })

  describe('Multiple simultaneous inputs (macOS trackpad)', () => {
    it('reference counts pointer and wheel inputs', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      // Pointer down
      act(() => {
        result.current.handlePointerDown()
      })
      expect(result.current.state).toBe('interacting')

      // Wheel starts while pointer still down (macOS trackpad)
      act(() => {
        result.current.handleWheelStart()
      })
      expect(result.current.state).toBe('interacting')

      // Pointer up - should NOT settle yet (wheel still active)
      act(() => {
        result.current.handlePointerUp()
      })
      expect(result.current.state).toBe('interacting') // Still interacting!

      // Wheel stops - NOW settle
      act(() => {
        result.current.handleWheelIdle()
      })
      expect(result.current.state).toBe('settling')
    })

    it('handles wheel-then-pointer overlap', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      // Wheel starts first
      act(() => {
        result.current.handleWheelStart()
      })

      // Pointer down while wheel active
      act(() => {
        result.current.handlePointerDown()
      })

      // Wheel stops
      act(() => {
        result.current.handleWheelIdle()
      })
      expect(result.current.state).toBe('interacting') // Pointer still down

      // Pointer up - NOW settle
      act(() => {
        result.current.handlePointerUp()
      })
      expect(result.current.state).toBe('settling')
    })
  })

  describe('Watchdog timer (vendor callback reliability)', () => {
    it('forces settle if onMomentumEnd never fires', () => {
      const onRequestClose = vi.fn()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
      })

      expect(result.current.state).toBe('settling')

      // Vendor callback never fires...
      // After 1000ms, watchdog should force settle to idle
      act(() => vi.advanceTimersByTime(1000))

      expect(result.current.state).toBe('idle')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Forcing settle')
      )

      // Should now schedule grace period
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
    })

    it('cancels watchdog if onMomentumEnd fires normally', () => {
      const onRequestClose = vi.fn()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
      })

      // Vendor callback fires normally
      act(() => {
        result.current.handleMomentumEnd(false)
      })

      // Watchdog should be cancelled
      act(() => vi.advanceTimersByTime(1000))
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('forceClose() for external close', () => {
    it('cancels close timer and immediately closes', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Should be in idle state with timer scheduled
      expect(result.current.state).toBe('idle')

      // External close (global lock)
      act(() => {
        result.current.forceClose()
      })

      expect(result.current.state).toBe('closed')

      // Timer should be cancelled - state stays closed
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
    })

    it('cancels watchdog timer on force close', () => {
      const onRequestClose = vi.fn()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
      })

      expect(result.current.state).toBe('settling')

      // Force close while settling
      act(() => {
        result.current.forceClose()
      })

      expect(result.current.state).toBe('closed')

      // Watchdog should NOT fire
      act(() => vi.advanceTimersByTime(1000))
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('resets interaction state on force close', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handleWheelStart()
      })

      expect(result.current.isInteracting).toBe(true)

      act(() => {
        result.current.forceClose()
      })

      // Should reset interaction state
      expect(result.current.state).toBe('closed')
      expect(result.current.isInteracting).toBe(false)
    })
  })

  describe('Controlled mode reset', () => {
    it('force closes when isOpen becomes false externally', () => {
      const onRequestClose = vi.fn()
      const { result, rerender } = renderHook(
        ({ isOpen }) =>
          usePickerStateMachine({
            isOpen,
            isControlled: true,
            onRequestClose,
          }),
        { initialProps: { isOpen: true } }
      )

      act(() => {
        result.current.handlePointerDown()
      })

      expect(result.current.state).toBe('interacting')

      // Parent closes picker externally
      act(() => {
        rerender({ isOpen: false })
      })

      // Should transition to closed via EXTERNAL_CLOSE event
      expect(result.current.state).toBe('closed')
      expect(result.current.isInteracting).toBe(false)
    })

    it('cancels timers when externally closed', () => {
      const onRequestClose = vi.fn()
      const { result, rerender } = renderHook(
        ({ isOpen }) =>
          usePickerStateMachine({
            isOpen,
            isControlled: true,
            onRequestClose,
          }),
        { initialProps: { isOpen: true } }
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Timer scheduled in idle state
      expect(result.current.state).toBe('idle')

      // External close
      act(() => {
        rerender({ isOpen: false })
      })

      expect(result.current.state).toBe('closed')

      // Timer should be cancelled
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
    })

    it('does not call onRequestClose on forceClose', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.forceClose()
      })

      // forceClose should NOT trigger onRequestClose
      expect(onRequestClose).not.toHaveBeenCalled()
    })
  })

  describe('Idle timer resets', () => {
    it('resets idle timer on resetIdleTimer() call', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          idleTimeout: 4000,
        })
      )

      // Get to idle state (multi-gesture)
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
        result.current.handlePointerDown() // multi-gesture
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Wait 3s
      act(() => vi.advanceTimersByTime(3000))

      // Reset timer (user hovers or small movement)
      act(() => {
        result.current.resetIdleTimer()
      })

      // Still in idle state
      expect(result.current.state).toBe('idle')

      // Wait another 3s (total 6s from start, but 3s from reset)
      act(() => vi.advanceTimersByTime(3000))
      expect(result.current.state).toBe('idle') // Still open!

      // Wait final 1s (4s from reset)
      act(() => vi.advanceTimersByTime(1000))
      expect(result.current.state).toBe('closed')
    })

    it('resetIdleTimer only works in idle state', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
      })

      // resetIdleTimer should be no-op while interacting
      act(() => {
        result.current.resetIdleTimer()
      })

      expect(result.current.state).toBe('interacting')
    })
  })

  describe('Boundary detection affects close context', () => {
    it('passes atBoundary: true to onRequestClose', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(true) // at boundary
      })

      expect(result.current.state).toBe('idle')
      act(() => vi.runAllTimers())
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: true,
      })
    })

    it('passes atBoundary: false when not at boundary', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false) // not at boundary
      })

      // Wait for grace period
      act(() => vi.advanceTimersByTime(150))
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })
  })

  describe('Timer delay configuration', () => {
    it('uses custom settleGracePeriod for single gesture', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 300, // Custom
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // State should be idle
      expect(result.current.state).toBe('idle')

      // onRequestClose NOT called yet (waits for grace period)
      expect(onRequestClose).not.toHaveBeenCalled()

      // Should use custom grace period (300ms)
      act(() => vi.advanceTimersByTime(299))
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // After grace period expires, transitions to closed and calls onRequestClose
      act(() => vi.advanceTimersByTime(1))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalled()
    })

    it('uses custom idleTimeout for multi-gesture', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          idleTimeout: 2000, // Custom
        })
      )

      // Multi-gesture to get to idle
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Should use custom idle timeout (2000ms)
      act(() => vi.advanceTimersByTime(1999))
      expect(result.current.state).toBe('idle')

      act(() => vi.advanceTimersByTime(1))
      expect(result.current.state).toBe('closed')
    })

    it('uses custom wheelIdleTimeout for wheel-opened single gesture', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          wheelIdleTimeout: 500, // Custom (default is 800ms)
        })
      )

      // Wheel-opened single gesture
      act(() => {
        result.current.handleWheelStart()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Should use custom wheel idle timeout (500ms)
      act(() => vi.advanceTimersByTime(499))
      expect(result.current.state).toBe('idle')

      act(() => vi.advanceTimersByTime(1))
      expect(result.current.state).toBe('closed')
    })
  })

  describe('Single gesture detection', () => {
    it('detects single gesture when opened via first interaction', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      // First pointer down = single gesture
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // State should be idle, waiting for grace period
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // After grace period (150ms), should call with reason: 'gesture'
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })

    it('detects multi-gesture on second interaction', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          idleTimeout: 4000,
        })
      )

      // First gesture
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // State idle, onRequestClose not called yet (waits for delay)
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // Second gesture before close (interrupts timer)
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // State idle again, still no calls yet
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // Should use idle timeout (4000ms), not grace period (150ms)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('idle') // Still open
      expect(onRequestClose).not.toHaveBeenCalled() // No call yet

      // After full idle timeout (4000ms total), should call with reason: 'idle'
      act(() => vi.advanceTimersByTime(3850))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'idle',
        atBoundary: false,
      })
    })
  })

  describe('XState-specific: Guards work correctly', () => {
    it('hasNoActiveInputs guard prevents settling with active wheel', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handleWheelStart() // Both active now
      })

      // Release pointer - should NOT settle (wheel still active)
      act(() => {
        result.current.handlePointerUp()
      })

      expect(result.current.state).toBe('interacting') // Guard blocked transition
    })

    it('isSingleGesture guard controls close behavior', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
          idleTimeout: 4000,
        })
      )

      // Single gesture
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Wait for grace period (150ms) to expire
      act(() => vi.advanceTimersByTime(150))

      // Guard ensures notifyRequestClose fires with 'gesture' (not 'idle')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })
  })

  describe('XState-specific: Actions update context correctly', () => {
    it('startPointerInteraction increments interaction count within single session', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          idleTimeout: 4000,
        })
      )

      // First interaction
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Second interaction BEFORE auto-close (still same session)
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Should use idle timeout (multi-gesture within same session)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('idle') // Still open (not closed yet)

      // After full idle timeout, closes
      act(() => vi.advanceTimersByTime(3850))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'idle', // Multi-gesture
        atBoundary: false,
      })
    })

    it('resetInteractionState clears all state on close', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
        })
      )

      // Build up state
      act(() => {
        result.current.handlePointerDown()
        result.current.handleWheelStart()
        result.current.handlePointerUp()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Force close (triggers resetInteractionState)
      act(() => {
        result.current.forceClose()
      })

      // Verify state is fully reset
      expect(result.current.state).toBe('closed')
      expect(result.current.isInteracting).toBe(false)

      // Next interaction should be treated as first (single gesture)
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Wait for grace period to expire
      act(() => vi.advanceTimersByTime(150))

      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture', // Single gesture (state was reset)
        atBoundary: false,
      })
    })
  })

  describe('XState-specific: Transition actions fire correctly', () => {
    it('fires notifyRequestClose after grace period for single gesture', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // onRequestClose NOT called on idle entry
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // Fires after grace period expires
      act(() => vi.advanceTimersByTime(150))
      expect(onRequestClose).toHaveBeenCalledTimes(1)
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })

    it('fires notifyRequestClose after idle timeout for multi-gesture', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          idleTimeout: 4000,
        })
      )

      // Multi-gesture
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // onRequestClose NOT called yet (waits for idle timeout)
      expect(result.current.state).toBe('idle')
      expect(onRequestClose).not.toHaveBeenCalled()

      // Fires after idle timeout (4000ms)
      act(() => vi.advanceTimersByTime(4000))
      expect(onRequestClose).toHaveBeenCalledTimes(1)
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'idle',
        atBoundary: false,
      })
    })
  })

  describe('Interaction counter reset on natural auto-close (bug fix)', () => {
    it('resets interaction count after natural auto-close', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      // First interaction: single gesture
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Wait for natural auto-close (grace period)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
      onRequestClose.mockClear()

      // Second interaction: should ALSO be single gesture (counter reset)
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Should use grace period (150ms), NOT idle timeout (4000ms)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })

    it('maintains consistent timing across repeated single gestures', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
        })
      )

      // Repeat 5 times to ensure no timing drift
      for (let i = 0; i < 5; i++) {
        onRequestClose.mockClear()

        act(() => {
          result.current.handlePointerDown()
          result.current.handlePointerUp()
          result.current.handleMomentumEnd(false)
        })

        // Should consistently use grace period (150ms)
        act(() => vi.advanceTimersByTime(150))
        expect(result.current.state).toBe('closed')
        expect(onRequestClose).toHaveBeenCalledWith({
          reason: 'gesture', // Always 'gesture', never 'idle'
          atBoundary: false,
        })
      }
    })

    it('resets wheel flag on natural auto-close', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          wheelIdleTimeout: 800,
          settleGracePeriod: 150,
        })
      )

      // First interaction: wheel (should use 800ms timeout)
      act(() => {
        result.current.handleWheelStart()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      // Wait for wheel timeout
      act(() => vi.advanceTimersByTime(800))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
      onRequestClose.mockClear()

      // Second interaction: pointer (should use 150ms, not 800ms)
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      // Should use grace period (150ms), not wheel timeout (800ms)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })
  })

  describe('Wheel-specific timing scenarios', () => {
    it('uses wheelIdleTimeout for single wheel scroll', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          wheelIdleTimeout: 800,
          settleGracePeriod: 150,
        })
      )

      // Single wheel scroll
      act(() => {
        result.current.handleWheelStart()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Should use wheel timeout (800ms), not grace period (150ms)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('idle') // Still open

      act(() => vi.advanceTimersByTime(650)) // 800ms total
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'gesture',
        atBoundary: false,
      })
    })

    it('uses idleTimeout for multiple separate wheel scrolls', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          wheelIdleTimeout: 800,
          idleTimeout: 4000,
        })
      )

      // First wheel scroll
      act(() => {
        result.current.handleWheelStart()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Second wheel scroll (before auto-close)
      act(() => {
        result.current.handleWheelStart()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Should use idle timeout (4000ms), not wheel timeout (800ms)
      act(() => vi.advanceTimersByTime(800))
      expect(result.current.state).toBe('idle') // Still open

      act(() => vi.advanceTimersByTime(3200)) // 4000ms total
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'idle', // Multi-gesture
        atBoundary: false,
      })
    })

    it('maintains wheel timing consistency across repeated single scrolls', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          wheelIdleTimeout: 800,
        })
      )

      // Repeat 3 times to verify consistent timing
      for (let i = 0; i < 3; i++) {
        onRequestClose.mockClear()

        act(() => {
          result.current.handleWheelStart()
          result.current.handleWheelIdle()
          result.current.handleMomentumEnd(false)
        })

        // Should consistently use wheel timeout (800ms)
        act(() => vi.advanceTimersByTime(800))
        expect(result.current.state).toBe('closed')
        expect(onRequestClose).toHaveBeenCalledWith({
          reason: 'gesture', // Always 'gesture'
          atBoundary: false,
        })
      }
    })
  })

  describe('Mixed interaction scenarios', () => {
    it('uses idleTimeout when mixing pointer and wheel', () => {
      const onRequestClose = vi.fn()
      const { result } = renderHook(() =>
        usePickerStateMachine({
          isOpen: true,
          isControlled: false,
          onRequestClose,
          settleGracePeriod: 150,
          idleTimeout: 4000,
        })
      )

      // First: pointer
      act(() => {
        result.current.handlePointerDown()
        result.current.handlePointerUp()
        result.current.handleMomentumEnd(false)
      })

      expect(result.current.state).toBe('idle')

      // Second: wheel (before auto-close)
      act(() => {
        result.current.handleWheelStart()
        result.current.handleWheelIdle()
        result.current.handleMomentumEnd(false)
      })

      // Should use idle timeout (4000ms)
      act(() => vi.advanceTimersByTime(150))
      expect(result.current.state).toBe('idle') // Still open

      act(() => vi.advanceTimersByTime(3850)) // 4000ms total
      expect(result.current.state).toBe('closed')
      expect(onRequestClose).toHaveBeenCalledWith({
        reason: 'idle', // Multi-gesture
        atBoundary: false,
      })
    })
  })
})
