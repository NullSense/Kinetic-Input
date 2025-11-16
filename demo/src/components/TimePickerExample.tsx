import { useState } from 'react';
import { PickerGroup, PickerColumn, PickerItem } from '@tensil/kinetic-input';

/**
 * Multi-Column Time Picker Example
 * Demonstrates iOS-style time selection with hours, minutes, and AM/PM
 */
export function TimePickerExample() {
  const [time, setTime] = useState({ hours: '10', minutes: '30', period: 'AM' });

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, '0')
  );
  const periods = ['AM', 'PM'];

  return (
    <div className="time-picker-demo">
      <div className="mb-4 text-center">
        <div className="text-2xl font-mono text-accent">
          {time.hours}:{time.minutes} {time.period}
        </div>
        <div className="text-xs text-muted mt-1">Multi-column picker</div>
      </div>

      <div className="ios-time-picker glass-subtle p-4 rounded-lg">
        <PickerGroup
          className="flex gap-2"
          style={{ '--picker-highlight-color': 'rgba(62, 220, 255, 0.8)' } as React.CSSProperties}
          value={{
            h: time.hours,
            m: time.minutes,
            p: time.period,
          }}
          onChange={(newValue: {
            h: string | number;
            m: string | number;
            p: string | number;
          }) =>
            setTime({
              hours: String(newValue.h),
              minutes: String(newValue.m),
              period: String(newValue.p),
            })
          }
          height={200}
          itemHeight={40}
        >
          <PickerColumn name="h" className="flex-1">
            {hours.map((h) => (
              <PickerItem
                key={h}
                value={h}
                className="text-muted data-[selected=true]:text-accent text-lg"
              >
                {h}
              </PickerItem>
            ))}
          </PickerColumn>

          <div className="flex items-center text-accent text-2xl font-bold self-center">
            :
          </div>

          <PickerColumn name="m" className="flex-1">
            {minutes.map((m) => (
              <PickerItem
                key={m}
                value={m}
                className="text-muted data-[selected=true]:text-accent text-lg"
              >
                {m}
              </PickerItem>
            ))}
          </PickerColumn>

          <PickerColumn name="p" className="flex-1">
            {periods.map((p) => (
              <PickerItem
                key={p}
                value={p}
                className="text-muted data-[selected=true]:text-accent text-lg"
              >
                {p}
              </PickerItem>
            ))}
          </PickerColumn>
        </PickerGroup>
      </div>
    </div>
  );
}
