import React, { useMemo, useCallback } from 'react';
import { PickerGroup } from '../picker';
import type { CollapsiblePickerRenderItemState } from './types';
import type { SnapPhysicsConfig } from '../picker/types/snapPhysics';
import type { PickerGestureHandler } from '../picker/gestures';
import { usePickerConfig, usePickerData, type PickerOption } from '../picker';

// Shared empty props object to avoid 10,000 allocations for large datasets
const EMPTY_PROPS = {};

export interface PickerBodyProps {
    values: string[];
    unit?: string;
    renderItem: (value: string, state: CollapsiblePickerRenderItemState) => React.ReactNode | undefined;
    hasCustomRenderItem: boolean;
    pickerWindowHeight: number;
    itemHeightPx: number;
    selectedValue: { value: string };
    handleValueChange: (newValue: { value: string }) => void;
    onGesture: PickerGestureHandler;
    showPicker: boolean;
    snapConfig?: SnapPhysicsConfig;
}

/**
 * Renders the mobile picker column for the quick number input, wiring
 * change/drag callbacks and virtualization-friendly rows.
 * @param {PickerBodyProps} props
 * @returns {React.ReactElement}
 */
export const PickerBody = React.memo(function PickerBody({
    values,
    unit,
    renderItem,
    hasCustomRenderItem,
    pickerWindowHeight,
    itemHeightPx,
    selectedValue,
    handleValueChange,
    onGesture,
    showPicker,
    snapConfig,
}: PickerBodyProps) {
    // Shared render function eliminates 10,000 function closures for scalability
    const sharedRender = useCallback(
        (state: { selected: boolean; visuallySelected: boolean; value: string | number }) => (
            <PickerValueRow
                value={String(state.value)}
                unit={unit}
                renderItem={renderItem}
                hasCustomRenderItem={hasCustomRenderItem}
                state={state}
            />
        ),
        [hasCustomRenderItem, renderItem, unit]
    );

    // Direct options array bypasses O(n²) registration for scalability (thousands of items)
    const options = useMemo<PickerOption[]>(
        () =>
            values.map((val) => ({
                value: val,
                render: sharedRender, // Same function reference for all items!
                props: EMPTY_PROPS, // Shared empty object (eliminates 10,000 allocations)
            })),
        [sharedRender, values]
    );

    return (
        <PickerGroup
            value={selectedValue}
            onChange={handleValueChange}
            height={pickerWindowHeight}
            itemHeight={itemHeightPx}
        >
            <PickerGroup.Column
                name="value"
                isPickerOpen={showPicker}
                snapConfig={snapConfig}
                onGesture={onGesture}
                options={options}
            />
        </PickerGroup>
    );
});

interface PickerValueRowProps {
    value: string;
    unit?: string;
    renderItem: (value: string, state: CollapsiblePickerRenderItemState) => React.ReactNode | undefined;
    hasCustomRenderItem: boolean;
    state: { selected: boolean; visuallySelected: boolean };
}

/**
 * Displays a single picker row with the proper selected/active styling or a custom renderer.
 * @param {PickerValueRowProps} props
 * @returns {React.ReactElement}
 */
export const PickerValueRow: React.FC<PickerValueRowProps> = React.memo(
    ({ value, unit, renderItem, hasCustomRenderItem, state }) => {
        // Read from context to avoid recreating parent items on every selection change
        // Note: We trust state.selected from PickerColumn, don't override it
        const derivedSelected = state.selected;
        const derivedVisuallySelected = state.visuallySelected;

        const renderState: CollapsiblePickerRenderItemState = useMemo(
            () => ({
                selected: derivedSelected,
                visuallySelected: derivedVisuallySelected,
                unit,
                deselecting: false,
            }),
            [derivedSelected, derivedVisuallySelected, unit]
        );

        if (hasCustomRenderItem) {
            const rendered = renderItem(value, renderState);
            if (rendered !== undefined && rendered !== null) {
                return <>{rendered}</>;
            }
        }

        const className = [
            'picker-item',
            derivedVisuallySelected
                ? 'picker-item-active'
                : derivedSelected
                ? 'picker-item-selected'
                : '',
        ]
            .filter(Boolean)
            .join(' ');

        // ✅ FIX: Always show values - PickerBody is only mounted when picker is open
        // Conditional hiding caused timing issues where initial render showed empty strings
        // before isPickerOpen context updated
        return (
            <div className={className}>
                <span className="picker-item-value">{value}</span>
                {unit && <span className="picker-item-unit">{unit}</span>}
            </div>
        );
    },
    (prevProps, nextProps) =>
        prevProps.value === nextProps.value &&
        prevProps.unit === nextProps.unit &&
        prevProps.state.visuallySelected === nextProps.state.visuallySelected &&
        prevProps.hasCustomRenderItem === nextProps.hasCustomRenderItem &&
        prevProps.renderItem === nextProps.renderItem
    // Note: We don't check state.selected because PickerValueRow reads actual selection from context
);
