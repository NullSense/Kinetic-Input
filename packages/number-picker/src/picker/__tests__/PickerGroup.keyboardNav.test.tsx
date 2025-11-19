import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PickerGroup from '../PickerGroup';
import PickerColumn from '../PickerColumn';
import PickerItem from '../PickerItem';

describe('PickerGroup keyboard navigation', () => {
  it('single column: left/right arrows increment/decrement value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PickerGroup value={{ col: '2' }} onChange={onChange} itemHeight={40} height={200}>
        <PickerColumn name="col">
          <PickerItem value="0">0</PickerItem>
          <PickerItem value="1">1</PickerItem>
          <PickerItem value="2">2</PickerItem>
          <PickerItem value="3">3</PickerItem>
          <PickerItem value="4">4</PickerItem>
        </PickerColumn>
      </PickerGroup>
    );

    const column = screen.getByRole('option', { name: '2' }).closest('.picker-column') as HTMLElement;
    column.focus();

    // Right arrow should increment
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith({ col: '3' }, 'col');

    onChange.mockClear();

    // Left arrow should decrement
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith({ col: '1' }, 'col');
  });

  it('multi-column: left/right arrows change column focus, up/down change value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PickerGroup
        value={{ hours: '10', minutes: '30' }}
        onChange={onChange}
        itemHeight={40}
        height={200}
      >
        <PickerColumn name="hours">
          <PickerItem value="1">1</PickerItem>
          <PickerItem value="2">2</PickerItem>
          <PickerItem value="10">10</PickerItem>
          <PickerItem value="11">11</PickerItem>
          <PickerItem value="12">12</PickerItem>
        </PickerColumn>
        <PickerColumn name="minutes">
          <PickerItem value="00">00</PickerItem>
          <PickerItem value="15">15</PickerItem>
          <PickerItem value="30">30</PickerItem>
          <PickerItem value="45">45</PickerItem>
        </PickerColumn>
      </PickerGroup>
    );

    const hoursColumn = screen.getAllByRole('option')[0].closest('.picker-column') as HTMLElement;
    const minutesColumn = screen.getAllByRole('option')[5].closest('.picker-column') as HTMLElement;

    // Focus first column
    hoursColumn.focus();
    expect(document.activeElement).toBe(hoursColumn);

    // Right arrow should move to second column (NOT change value)
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(minutesColumn);
    expect(onChange).not.toHaveBeenCalled(); // No value change

    // Left arrow should move back to first column
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(hoursColumn);
    expect(onChange).not.toHaveBeenCalled(); // No value change

    // Up arrow should change value in current column
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenCalledWith({ hours: '2', minutes: '30' }, 'hours');
    expect(document.activeElement).toBe(hoursColumn); // Focus stays on same column

    onChange.mockClear();

    // Down arrow should change value in current column
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenCalledWith({ hours: '11', minutes: '30' }, 'hours');
    expect(document.activeElement).toBe(hoursColumn); // Focus stays on same column
  });

  it('multi-column: left arrow at leftmost column does nothing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PickerGroup
        value={{ a: '1', b: '2' }}
        onChange={onChange}
        itemHeight={40}
        height={200}
      >
        <PickerColumn name="a">
          <PickerItem value="1">A1</PickerItem>
          <PickerItem value="2">A2</PickerItem>
        </PickerColumn>
        <PickerColumn name="b">
          <PickerItem value="1">B1</PickerItem>
          <PickerItem value="2">B2</PickerItem>
        </PickerColumn>
      </PickerGroup>
    );

    const firstColumn = screen.getAllByRole('option')[0].closest('.picker-column') as HTMLElement;
    firstColumn.focus();

    // Left arrow at leftmost column should not change focus or value
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(firstColumn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('multi-column: right arrow at rightmost column does nothing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PickerGroup
        value={{ a: '1', b: '2' }}
        onChange={onChange}
        itemHeight={40}
        height={200}
      >
        <PickerColumn name="a">
          <PickerItem value="1">A1</PickerItem>
          <PickerItem value="2">A2</PickerItem>
        </PickerColumn>
        <PickerColumn name="b">
          <PickerItem value="1">B1</PickerItem>
          <PickerItem value="2">B2</PickerItem>
        </PickerColumn>
      </PickerGroup>
    );

    const lastColumn = screen.getAllByRole('option')[2].closest('.picker-column') as HTMLElement;
    lastColumn.focus();

    // Right arrow at rightmost column should not change focus or value
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(lastColumn);
    expect(onChange).not.toHaveBeenCalled();
  });
});
