import { useState, useEffect, useMemo } from 'react';
import type { Event } from '../lib/types';
import EventCard from './EventCard';

function groupByMonth(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const event of events) {
    const d = new Date(event.event_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const group = map.get(key);
    if (group) group.push(event);
    else map.set(key, [event]);
  }
  return map;
}

function formatMonthHeader(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1);
  const label = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function Timeline() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  async function fetchEvents() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error();
      setEvents(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  const upcomingEvents = useMemo(
    () => events.filter((e) => new Date(e.event_date) >= now),
    [events, now]
  );
  const pastEvents = useMemo(
    () => events.filter((e) => new Date(e.event_date) < now),
    [events, now]
  );

  const upcomingMonths = useMemo(
    () => Array.from(groupByMonth(upcomingEvents).keys()).sort(),
    [upcomingEvents]
  );
  const pastMonths = useMemo(
    () => Array.from(groupByMonth(pastEvents).keys()).sort(),
    [pastEvents]
  );

  const availableMonths = useMemo(
    () => (showPast ? [...pastMonths, ...upcomingMonths] : [...upcomingMonths]).sort(),
    [showPast, pastMonths, upcomingMonths]
  );

  const allByMonth = useMemo(() => groupByMonth(events), [events]);

  // Set initial selectedMonth once events load
  useEffect(() => {
    if (!loading && !initialized && events.length > 0) {
      const firstUpcoming = upcomingMonths[0] || currentMonthKey;
      setSelectedMonth(firstUpcoming);
      setInitialized(true);
    }
  }, [loading, initialized, events, upcomingMonths, currentMonthKey]);

  // Reset to earliest upcoming month if viewing a past month when showPast is toggled off
  useEffect(() => {
    if (!showPast && selectedMonth && pastMonths.includes(selectedMonth)) {
      setSelectedMonth(upcomingMonths[0] || currentMonthKey);
    }
  }, [showPast, selectedMonth, pastMonths, upcomingMonths, currentMonthKey]);

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-lg mx-auto md:mx-0">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">Errore nel caricamento degli eventi</p>
        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (upcomingEvents.length === 0 && pastEvents.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg text-text-muted">Nessun evento in programma</p>
        <p className="text-sm text-text-muted mt-1">Torna a trovarci presto!</p>
      </div>
    );
  }

  const selectedIndex = selectedMonth ? availableMonths.indexOf(selectedMonth) : -1;
  const canGoPrev = selectedMonth !== null && selectedIndex > 0;
  const canGoNext = selectedMonth !== null && selectedIndex < availableMonths.length - 1;
  const isShowingAll = selectedMonth === null;

  function goPrev() {
    if (canGoPrev) setSelectedMonth(availableMonths[selectedIndex - 1]);
  }
  function goNext() {
    if (canGoNext) setSelectedMonth(availableMonths[selectedIndex + 1]);
  }

  // Determine which events to display
  let displayGroups: [string, Event[], boolean][] = [];
  if (isShowingAll) {
    const months = showPast ? [...pastMonths, ...upcomingMonths].sort() : [...upcomingMonths];
    for (const mk of months) {
      const evts = allByMonth.get(mk) || [];
      const isPast = pastMonths.includes(mk);
      if (!showPast && isPast) continue;
      displayGroups.push([mk, evts, isPast]);
    }
  } else if (selectedMonth) {
    const evts = allByMonth.get(selectedMonth) || [];
    const isPast = pastMonths.includes(selectedMonth);
    displayGroups.push([selectedMonth, evts, isPast]);
  }

  let globalIndex = 0;

  return (
    <div className="relative">
      {/* Month picker bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-6 flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          disabled={!canGoPrev || isShowingAll}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
          aria-label="Mese precedente"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-lg font-semibold text-text select-none">
          {isShowingAll ? 'Tutti gli eventi' : formatMonthHeader(selectedMonth!)}
        </span>

        <button
          onClick={goNext}
          disabled={!canGoNext || isShowingAll}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
          aria-label="Mese successivo"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          onClick={() => setSelectedMonth(isShowingAll ? (upcomingMonths[0] || currentMonthKey) : null)}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            isShowingAll
              ? 'bg-primary text-white'
              : 'text-primary hover:bg-primary/10'
          }`}
        >
          Tutti
        </button>
      </div>

      {/* Past events toggle */}
      {pastEvents.length > 0 && (
        <div className="text-center mb-6">
          <button
            onClick={() => setShowPast(!showPast)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showPast ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showPast ? 'Nascondi eventi passati' : `Mostra eventi passati (${pastEvents.length})`}
          </button>
        </div>
      )}

      {/* Vertical line - hidden on mobile */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" style={{ top: '80px' }} />

      {/* Events */}
      {displayGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted">Nessun evento questo mese</p>
        </div>
      )}

      {displayGroups.map(([monthKey, monthEvents, isPast]) => (
        <div key={monthKey}>
          {/* Month divider - only in "Tutti" view */}
          {isShowingAll && (
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-primary font-semibold text-lg whitespace-nowrap">
                {formatMonthHeader(monthKey)}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          <div className="space-y-8 md:space-y-12">
            {monthEvents.map((event) => {
              const idx = globalIndex++;
              return (
                <div key={event.id} className="relative">
                  <div className="hidden md:block absolute left-1/2 top-6 w-4 h-4 bg-primary rounded-full border-4 border-white shadow -translate-x-1/2 z-10" />
                  <EventCard event={event} position={idx % 2 === 0 ? 'left' : 'right'} past={isPast} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
