'use client';

import { useState } from 'react';

interface DateTimePickerProps {
  onSelect: (date: string, time: string) => void;
  onDayChange?: (date: string) => void;
  bookedSlots?: string[];
}

const SK_DAYS = ['Ned', 'Pon', 'Uto', 'Str', 'Štv', 'Pia', 'Sob'];
const SK_MONTHS = ['jan', 'feb', 'mar', 'apr', 'máj', 'jún', 'júl', 'aug', 'sep', 'okt', 'nov', 'dec'];

function generateTimeSlots(dayOfWeek: number): string[] {
  if (dayOfWeek === 0) return [];
  const endHour = dayOfWeek === 6 ? 14 : 18;
  const endMin  = dayOfWeek === 6 ? 30 : 0;
  const slots: string[] = [];
  let h = 9, m = 0;
  while (true) {
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push(time);
    if (h === endHour && m === endMin) break;
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return slots;
}

export default function DateTimePicker({
  onSelect,
  onDayChange,
  bookedSlots = [],
}: DateTimePickerProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const [selectedDay, setSelectedDay]   = useState<Date>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timesKey, setTimesKey]         = useState(0);

  const timeSlots = generateTimeSlots(selectedDay.getDay());

  const handleDaySelect = (day: Date) => {
    if (day.getDay() === 0) return;
    setSelectedTime('');
    setSelectedDay(day);
    setTimesKey((k) => k + 1);
    onDayChange?.(day.toISOString().split('T')[0]);
  };

  const handleTimeSelect = (time: string) => {
    if (bookedSlots.includes(time)) return;
    setSelectedTime(time);
    onSelect(selectedDay.toISOString().split('T')[0], time);
  };

  return (
    <div className="date-picker">
      <div className="date-picker__days">
        {days.map((day) => {
          const isSunday  = day.getDay() === 0;
          const isSelected = day.toDateString() === selectedDay.toDateString();
          let cls = 'date-picker__day';
          if (isSelected) cls += ' date-picker__day--selected';
          if (isSunday)   cls += ' date-picker__day--disabled';

          return (
            <button
              key={day.toDateString()}
              type="button"
              className={cls}
              onClick={() => handleDaySelect(day)}
            >
              <span className="date-picker__day-name">{SK_DAYS[day.getDay()]}</span>
              <span className="date-picker__day-number">{day.getDate()}</span>
              <span className="date-picker__day-month">
                {isSunday ? 'zatv.' : SK_MONTHS[day.getMonth()]}
              </span>
            </button>
          );
        })}
      </div>

      <div key={timesKey} className="date-picker__times">
        {timeSlots.length === 0 ? (
          <p className="date-picker__closed">Zatvorené</p>
        ) : (
          timeSlots.map((slot) => {
            const isBooked   = bookedSlots.includes(slot);
            const isSelected = selectedTime === slot;
            let cls = 'date-picker__time';
            if (isSelected) cls += ' date-picker__time--selected';
            if (isBooked)   cls += ' date-picker__time--booked';

            return (
              <button
                key={slot}
                type="button"
                className={cls}
                onClick={() => handleTimeSelect(slot)}
                disabled={isBooked}
                title={isBooked ? 'Obsadené' : undefined}
              >
                {slot}
                {isBooked && (
                  <span className="date-picker__time-booked-label">obsadené</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {selectedTime && (
        <p className="date-picker__selected-info">
          ✓ {SK_DAYS[selectedDay.getDay()]} {selectedDay.getDate()}. {SK_MONTHS[selectedDay.getMonth()]} o {selectedTime}
        </p>
      )}
    </div>
  );
}
