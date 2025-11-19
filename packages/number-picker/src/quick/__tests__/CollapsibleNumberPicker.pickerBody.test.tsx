import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PickerValueRow } from '../CollapsibleNumberPicker.pickerBody';
import { PickerConfigProvider } from '../../picker/context';
import PickerGroup from '../../picker/PickerGroup';

describe('PickerValueRow', () => {
    const baseProps = {
        unit: 'kg',
        renderItem: () => undefined,
        hasCustomRenderItem: false,
    } as const;

    // Wrapper to provide required context
    const TestWrapper = ({ children, value = 'value', isPickerOpen = true }: { children: React.ReactNode; value?: string; isPickerOpen?: boolean }) => (
        <PickerGroup value={{ value }} onChange={() => {}} itemHeight={40} height={200}>
            <PickerConfigProvider value={{ key: 'test-column', isPickerOpen }}>
                {children}
            </PickerConfigProvider>
        </PickerGroup>
    );

    it('only marks the active row while the picker is open', () => {
        const { container, rerender } = render(
            <TestWrapper value="10" isPickerOpen={true}>
                <PickerValueRow
                    value="10"
                    {...baseProps}
                    state={{ selected: false, visuallySelected: false }}
                />
            </TestWrapper>
        );

        const row = container.querySelector('.picker-item');
        expect(row).toBeTruthy();
        expect(row?.classList.contains('picker-item-active')).toBe(false);
        expect(row?.classList.contains('picker-item-selected')).toBe(false);

        rerender(
            <TestWrapper value="10" isPickerOpen={true}>
                <PickerValueRow
                    value="11"
                    {...baseProps}
                    state={{ selected: false, visuallySelected: true }}
                />
            </TestWrapper>
        );

        expect(container.querySelector('.picker-item-active')).toBeTruthy();
    });

    it('retains selected styling when the picker is closed', () => {
        const { container } = render(
            <TestWrapper value="15" isPickerOpen={false}>
                <PickerValueRow
                    value="15"
                    {...baseProps}
                    state={{ selected: false, visuallySelected: false }}
                />
            </TestWrapper>
        );

        const row = container.querySelector('.picker-item');
        expect(row).toBeTruthy();
        expect(row?.classList.contains('picker-item-selected')).toBe(true);
    });
});
