import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { Observation } from '@/types';
import {
  NEWS2_SECTIONS,
  SCORE_COLOURS,
  TITLE_BG,
  findMatchingBandIndex,
  sectionHasData,
} from '@/lib/chartConfig';

export type ChartDisplayMode = 'dots' | 'numbers';

interface Props {
  observations: Observation[];
  displayMode?: ChartDisplayMode;
  /** Year to display (defaults to current year) */
  year?: number;
  /** Month to display, 0-indexed (defaults to current month) */
  month?: number;
  id?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function totalScoreColour(total: number, hasRed: boolean): string {
  if (total >= 7) return '#F69781';
  if (total >= 5) return '#FCC98A';
  if (total >= 3 && hasRed) return '#FFF2AC';
  return '#ffffff';
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const NEWS2VisualChart = forwardRef<HTMLDivElement, Props>(
  ({ observations, displayMode = 'dots', year, month, id }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => internalRef.current!);
    const [lines, setLines] = useState<Line[]>([]);

    // Determine the month to display
    const now = new Date();
    const displayYear = year ?? now.getFullYear();
    const displayMonth = month ?? now.getMonth();

    // Filter observations to the selected month
    const monthStart = new Date(displayYear, displayMonth, 1);
    const monthEnd = new Date(displayYear, displayMonth + 1, 0, 23, 59, 59, 999);

    const monthObs = observations.filter((o) => {
      const d = new Date(o.recordedAt);
      return d >= monthStart && d <= monthEnd;
    });

    const sorted = [...monthObs].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );

    // Build day columns: one column per day of the month
    // If a day has observations, use them; otherwise null (empty column)
    const daysInMonth = monthEnd.getDate();
    type DayColumn = { day: number; obs: Observation | null };
    const dayColumns: DayColumn[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      // Find observations for this day (there could be multiple, we'll add all)
      const dayObs = sorted.filter((o) => new Date(o.recordedAt).getDate() === d);
      if (dayObs.length > 0) {
        dayObs.forEach((o) => dayColumns.push({ day: d, obs: o }));
      } else {
        dayColumns.push({ day: d, obs: null });
      }
    }

    const visibleSections = NEWS2_SECTIONS.filter((s) => sectionHasData(s, sorted));

    // Measure dot positions and compute connecting lines
    const computeLines = useCallback(() => {
      const container = internalRef.current;
      if (!container) return;

      const dots = container.querySelectorAll<HTMLElement>('[data-dot]');
      if (dots.length === 0) {
        setLines([]);
        return;
      }

      // Group dots by section
      const groups = new Map<string, HTMLElement[]>();
      dots.forEach((dot) => {
        const section = dot.dataset.dot!;
        if (!groups.has(section)) groups.set(section, []);
        groups.get(section)!.push(dot);
      });

      const containerRect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft;
      const newLines: Line[] = [];

      groups.forEach((sectionDots) => {
        // Sort by column index
        sectionDots.sort(
          (a, b) => Number(a.dataset.col) - Number(b.dataset.col),
        );

        for (let i = 0; i < sectionDots.length - 1; i++) {
          const a = sectionDots[i].getBoundingClientRect();
          const b = sectionDots[i + 1].getBoundingClientRect();
          newLines.push({
            x1: a.left + a.width / 2 - containerRect.left + scrollLeft,
            y1: a.top + a.height / 2 - containerRect.top,
            x2: b.left + b.width / 2 - containerRect.left + scrollLeft,
            y2: b.top + b.height / 2 - containerRect.top,
          });
        }
      });

      setLines(newLines);
    }, []);

    useEffect(() => {
      // Compute after initial render
      const timer = setTimeout(computeLines, 50);
      window.addEventListener('resize', computeLines);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', computeLines);
      };
    }, [computeLines, observations]);

    return (
      <div
        ref={internalRef}
        id={id}
        className="relative -mx-3 overflow-x-auto rounded-lg shadow sm:mx-0"
        onScroll={computeLines}
      >
        {/* SVG overlay for connecting lines — must match full scrollable width */}
        <svg
          className="pointer-events-none absolute top-0 left-0"
          style={{ minWidth: `${130 + dayColumns.length * 48}px`, width: '100%', height: '100%', zIndex: 10 }}
        >
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#0066cc"
              strokeWidth="2"
            />
          ))}
        </svg>

        <table
          className="border-collapse text-xs"
          style={{ minWidth: `${130 + dayColumns.length * 48}px`, tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: '70px' }} />
            <col style={{ width: '58px' }} />
            {dayColumns.map((_, i) => (
              <col key={i} style={{ width: '48px' }} />
            ))}
          </colgroup>
          <tbody>
            {/* ── Date/Time header ──────────────────────────── */}
            <tr>
              <td
                className="border border-gray-800 p-1 text-center align-middle font-bold text-white"
                style={{ background: TITLE_BG }}
                rowSpan={2}
              >
                NEWS key
                <div className="mt-1 flex justify-center gap-1">
                  {[0, 1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className="inline-block h-4 w-4 border border-gray-800 text-center text-[10px] font-bold leading-4"
                      style={{ background: SCORE_COLOURS[s].bg }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </td>
              <td className="border border-gray-800 p-1 text-right font-bold">DATE</td>
              {dayColumns.map((col, i) => (
                <td
                  key={i}
                  className={`border border-gray-800 p-1 text-center font-bold ${!col.obs ? 'text-slate-300' : ''}`}
                >
                  {col.obs
                    ? new Date(col.obs.recordedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : col.day}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-right font-normal">TIME</td>
              {dayColumns.map((col, i) => (
                <td
                  key={i}
                  className={`border border-gray-800 p-1 text-center font-normal ${!col.obs ? 'text-slate-300' : ''}`}
                >
                  {col.obs
                    ? new Date(col.obs.recordedAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </td>
              ))}
            </tr>

            {/* ── Spacer ──────────────────────────────────── */}
            <SpacerRow colSpan={2 + dayColumns.length} />

            {/* ── Parameter sections ──────────────────────── */}
            {visibleSections.map((section) => {
              const shouldShowForObs = (obs: Observation) => {
                if (section.id === 'sat1') return obs.spO2Scale === 1;
                if (section.id === 'sat2') return obs.spO2Scale === 2;
                return true;
              };

              return (
                <SectionBlock key={section.id}>
                  {section.bands.map((band, bandIdx) => (
                    <tr key={`${section.id}-${bandIdx}`}>
                      {/* Title column (first band only) */}
                      {bandIdx === 0 && (
                        <td
                          className="border border-gray-800 p-1 align-top font-bold text-white"
                          style={{ background: section.id === 'sat2' ? '#B1BBDE' : TITLE_BG }}
                          rowSpan={section.bands.length}
                        >
                          {section.sectionLabel && (
                            <div
                              className="text-xl font-bold"
                              style={{
                                color: section.id === 'sat2' ? '#000' : '#798FC8',
                              }}
                            >
                              {section.sectionLabel}
                            </div>
                          )}
                          <div style={{ color: section.id === 'sat2' ? '#000' : '#fff' }}>
                            {section.paramLabel}
                          </div>
                          {section.info && (
                            <div className="mt-0.5 text-[8px] font-bold" style={{ color: section.id === 'sat2' ? '#333' : '#ddd' }}>
                              {section.info}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Range label */}
                      <td
                        className="border border-gray-800 p-1 text-right font-bold whitespace-nowrap"
                        style={{ borderRight: '2px solid #333' }}
                      >
                        {band.label}
                      </td>

                      {/* Value cells */}
                      {dayColumns.map((col, colIdx) => {
                        // Empty day — no observation
                        if (!col.obs) {
                          return (
                            <td
                              key={`empty-${colIdx}`}
                              className="border border-gray-800 p-0 text-center"
                              style={{ background: SCORE_COLOURS[band.score].bg, height: '20px' }}
                            />
                          );
                        }

                        const obs = col.obs;

                        // Declined observations: red vertical line, white bg preserved
                        // "DECLINED" text only rendered in the blood pressure section (tallest section)
                        if (obs.declined) {
                          const isBpSection = section.id === 'bp';
                          return (
                            <td
                              key={obs.id}
                              className="relative border border-gray-800 p-0 text-center"
                              style={{ background: SCORE_COLOURS[band.score].bg, height: '20px' }}
                            >
                              {/* Red vertical line — split into two segments around text */}
                              {isBpSection && bandIdx === Math.floor(section.bands.length / 2) ? (
                                <>
                                  {/* Line above text */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: 0,
                                      height: 'calc(50% - 18px)',
                                      width: '3px',
                                      marginLeft: '-1.5px',
                                      backgroundColor: '#DC2626',
                                      zIndex: 15,
                                    }}
                                  />
                                  {/* "DECLINED" text with white background so line doesn't cross it */}
                                  <span
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '50%',
                                      transform: 'translate(-50%, -50%) rotate(-90deg)',
                                      color: '#DC2626',
                                      fontWeight: 'bold',
                                      fontSize: '10px',
                                      letterSpacing: '1px',
                                      whiteSpace: 'nowrap',
                                      zIndex: 20,
                                      pointerEvents: 'none',
                                      backgroundColor: SCORE_COLOURS[band.score].bg,
                                      padding: '0 2px',
                                    }}
                                  >
                                    DECLINED
                                  </span>
                                  {/* Line below text */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: '50%',
                                      bottom: 0,
                                      height: 'calc(50% - 18px)',
                                      width: '3px',
                                      marginLeft: '-1.5px',
                                      backgroundColor: '#DC2626',
                                      zIndex: 15,
                                    }}
                                  />
                                </>
                              ) : (
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: 0,
                                    bottom: 0,
                                    width: '3px',
                                    marginLeft: '-1.5px',
                                    backgroundColor: '#DC2626',
                                    zIndex: 15,
                                  }}
                                />
                              )}
                            </td>
                          );
                        }

                        const matchIdx = shouldShowForObs(obs)
                          ? findMatchingBandIndex(section, obs)
                          : -1;
                        const isMatch = matchIdx === bandIdx;
                        const value = obs[section.paramKey as keyof Observation];

                        return (
                          <td
                            key={obs.id}
                            className="border border-gray-800 p-0 text-center"
                            style={{
                              background: SCORE_COLOURS[band.score].bg,
                              height: '20px',
                            }}
                          >
                            {isMatch && (
                              <div
                                className="flex items-center justify-center"
                                style={{ height: '100%', minHeight: '20px', position: 'relative', zIndex: 20 }}
                                data-dot={section.id}
                                data-col={colIdx}
                              >
                                {displayMode === 'dots' ? (
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      width: '10px',
                                      height: '10px',
                                      borderRadius: '50%',
                                      backgroundColor: '#0066cc',
                                    }}
                                  />
                                ) : (
                                  <span
                                    className="font-bold"
                                    style={{
                                      fontSize: '10px',
                                      color: '#000',
                                      position: 'relative',
                                      zIndex: 30,
                                      textShadow: '0 0 3px #fff, 0 0 3px #fff',
                                    }}
                                  >
                                    {band.match !== undefined
                                      ? String(value).substring(0, 1)
                                      : String(value)}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Spacer after section */}
                  <SpacerRow colSpan={2 + dayColumns.length} />
                </SectionBlock>
              );
            })}

            {/* ── NEWS2 Total ─────────────────────────────── */}
            <tr>
              <td
                className="border border-gray-800 p-1 font-bold text-white"
                style={{ background: TITLE_BG }}
                colSpan={2}
              >
                NEWS TOTAL
              </td>
              {dayColumns.map((col, i) => {
                if (!col.obs) {
                  return <td key={`total-empty-${i}`} className="border border-gray-800 p-1 text-center" style={{ background: '#ffffff' }} />;
                }
                const obs = col.obs;
                if (obs.declined) {
                  return (
                    <td
                      key={obs.id}
                      className="relative border border-gray-800 p-1 text-center text-sm font-bold"
                      style={{ background: '#ffffff' }}
                    >
                      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', marginLeft: '-1.5px', backgroundColor: '#DC2626' }} />
                    </td>
                  );
                }
                const hasRed = Object.values(obs.scores).some((s) => s === 3);
                return (
                  <td
                    key={obs.id}
                    className="border border-gray-800 p-1 text-center text-sm font-bold"
                    style={{ background: totalScoreColour(obs.totalScore, hasRed) }}
                  >
                    {obs.totalScore}
                  </td>
                );
              })}
            </tr>

            <SpacerRow colSpan={2 + dayColumns.length} />

            {/* ── Bottom section ──────────────────────────── */}
            <tr>
              <td className="border border-gray-800 p-1 text-right font-bold" colSpan={2}>
                Monitoring frequency
              </td>
              {dayColumns.map((col, i) => (
                <td
                  key={i}
                  className="relative border border-gray-800 p-1 text-center text-[10px]"
                >
                  {!col.obs ? '' : col.obs.declined ? (
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', marginLeft: '-1.5px', backgroundColor: '#DC2626' }} />
                  ) : (
                    col.obs.totalScore >= 7
                      ? 'Cont.'
                      : col.obs.totalScore >= 5
                        ? '1h'
                        : col.obs.totalScore >= 1
                          ? '4\u20136h'
                          : '12h'
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-right font-bold" colSpan={2}>
                Escalation Y/N
              </td>
              {dayColumns.map((col, i) => (
                <td
                  key={i}
                  className="relative border border-gray-800 p-1 text-center text-[10px]"
                >
                  {!col.obs ? '' : col.obs.declined ? (
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', marginLeft: '-1.5px', backgroundColor: '#DC2626' }} />
                  ) : (
                    col.obs.totalScore >= 5 ? 'Y' : 'N'
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border border-gray-800 p-1 text-right font-bold" colSpan={2}>
                Initials
              </td>
              {dayColumns.map((col, i) => (
                <td
                  key={i}
                  className="relative border border-gray-800 p-1 text-center text-[10px]"
                >
                  {!col.obs ? '' : col.obs.declined ? (
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '3px', marginLeft: '-1.5px', backgroundColor: '#DC2626' }} />
                  ) : (
                    getInitials(col.obs.recordedBy)
                  )}
                </td>
              ))}
            </tr>

            <SpacerRow colSpan={2 + dayColumns.length} />
          </tbody>
        </table>
      </div>
    );
  },
);

export default NEWS2VisualChart;

function SpacerRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          height: '8px',
          borderTop: '2px solid #333',
          borderBottom: '2px solid #333',
          borderLeft: '2px solid #fff',
          borderRight: '2px solid #fff',
        }}
      />
    </tr>
  );
}

function SectionBlock({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
