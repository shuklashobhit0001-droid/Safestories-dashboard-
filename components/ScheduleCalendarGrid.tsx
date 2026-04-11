import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ScheduleCalendarGrid.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0..23

// Convert availability array → 2D boolean grid [dayIdx][hour]
function availabilityToGrid(availability: any[]): boolean[][] {
  const grid: boolean[][] = DAYS.map(() => Array(24).fill(false));
  availability.forEach((a: any) => {
    if (/\d{4}-\d{2}-\d{2}/.test(a.day || '')) return; // skip date overrides
    const dayIdx = DAYS.findIndex(d => (a.day || '').toUpperCase().startsWith(d));
    if (dayIdx === -1 || !a.is_available) return;
    (a.times || []).forEach((t: any) => {
      const startH = parseInt(t.start?.split(':')[0] ?? '0', 10);
      const endH = parseInt(t.end?.split(':')[0] ?? '0', 10);
      for (let h = startH; h < endH; h++) {
        if (h >= 0 && h < 24) grid[dayIdx][h] = true;
      }
    });
  });
  return grid;
}

// Convert 2D boolean grid → availability array (only weekly days)
function gridToAvailability(grid: boolean[][]): any[] {
  return DAYS.map((day, dayIdx) => {
    const hours = grid[dayIdx];
    const times: { start: string; end: string }[] = [];
    let i = 0;
    while (i < 24) {
      if (hours[i]) {
        const start = i;
        while (i < 24 && hours[i]) i++;
        times.push({
          start: `${String(start).padStart(2, '0')}:00`,
          end: `${String(i).padStart(2, '0')}:00`,
        });
      } else {
        i++;
      }
    }
    return {
      day,
      is_available: times.length > 0,
      times: times.length > 0 ? times : [{ start: '09:00', end: '17:00' }],
    };
  });
}

function formatHour(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

interface Props {
  availability: any[];
  onChange: (newAvailability: any[]) => void;
}

const ScheduleCalendarGrid: React.FC<Props> = ({ availability, onChange }) => {
  const [grid, setGrid] = useState<boolean[][]>(() => availabilityToGrid(availability));

  // Re-sync when availability prop changes (e.g. after fetch)
  useEffect(() => {
    setGrid(availabilityToGrid(availability));
  }, [availability]);

  const dragState = useRef<{
    active: boolean;
    painting: boolean; // true = painting open, false = painting closed
    dayIdx: number;
  } | null>(null);

  const commitGrid = useCallback((g: boolean[][]) => {
    const weeklyOnly = gridToAvailability(g);
    // Preserve date overrides from original availability
    const overrides = availability.filter((a: any) => /\d{4}-\d{2}-\d{2}/.test(a.day || ''));
    onChange([...weeklyOnly, ...overrides]);
  }, [availability, onChange]);

  const handleMouseDown = (dayIdx: number, hour: number, e: React.MouseEvent) => {
    e.preventDefault();
    const painting = !grid[dayIdx][hour];
    dragState.current = { active: true, painting, dayIdx };
    const newGrid = grid.map(row => [...row]);
    newGrid[dayIdx][hour] = painting;
    setGrid(newGrid);
  };

  const handleMouseEnter = (dayIdx: number, hour: number) => {
    if (!dragState.current?.active || dragState.current.dayIdx !== dayIdx) return;
    const newGrid = grid.map(row => [...row]);
    newGrid[dayIdx][hour] = dragState.current.painting;
    setGrid(newGrid);
  };

  const handleMouseUp = () => {
    if (dragState.current?.active) {
      dragState.current = { ...dragState.current, active: false };
      commitGrid(grid);
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [grid]);

  const toggleDay = (dayIdx: number) => {
    const isAnyOn = grid[dayIdx].some(Boolean);
    const newGrid = grid.map(row => [...row]);
    if (isAnyOn) {
      newGrid[dayIdx] = Array(24).fill(false);
    } else {
      // Default 9–17
      newGrid[dayIdx] = Array(24).fill(false).map((_, h) => h >= 9 && h < 17);
    }
    setGrid(newGrid);
    commitGrid(newGrid);
  };

  return (
    <div className="scg-wrapper" onMouseLeave={handleMouseUp}>
      {/* Day headers */}
      <div className="scg-grid">
        {/* Hour label column */}
        <div className="scg-hour-col">
          <div className="scg-day-header scg-hour-header" />
          {HOURS.map(h => (
            <div key={h} className="scg-hour-label">{formatHour(h)}</div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day, dayIdx) => {
          const isActive = grid[dayIdx].some(Boolean);
          return (
            <div key={day} className="scg-day-col">
              <div
                className={`scg-day-header ${isActive ? 'active' : 'inactive'}`}
                onClick={() => toggleDay(dayIdx)}
                title={isActive ? 'Click to mark day unavailable' : 'Click to set default 9–5'}
              >
                <span className="scg-day-name">{DAY_LABELS[dayIdx]}</span>
                <span className={`scg-day-dot ${isActive ? 'on' : 'off'}`} />
              </div>
              {HOURS.map(h => {
                const on = grid[dayIdx][h];
                return (
                  <div
                    key={h}
                    className={`scg-cell ${on ? 'on' : 'off'}`}
                    onMouseDown={(e) => handleMouseDown(dayIdx, h, e)}
                    onMouseEnter={() => handleMouseEnter(dayIdx, h)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="scg-hint">Drag to open/close hours · Click a day header to toggle the whole day</p>
    </div>
  );
};

export default ScheduleCalendarGrid;
