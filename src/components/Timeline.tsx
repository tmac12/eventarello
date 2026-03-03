import { useState, useEffect } from 'react';
import type { Event } from '../lib/types';
import EventCard from './EventCard';

export default function Timeline() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (events.length === 0) {
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

  return (
    <div className="relative">
      {/* Vertical line - hidden on mobile */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />

      <div className="space-y-8 md:space-y-12">
        {events.map((event, i) => (
          <div key={event.id} className="relative">
            {/* Dot on timeline - hidden on mobile */}
            <div className="hidden md:block absolute left-1/2 top-6 w-4 h-4 bg-primary rounded-full border-4 border-white shadow -translate-x-1/2 z-10" />
            <EventCard event={event} position={i % 2 === 0 ? 'left' : 'right'} />
          </div>
        ))}
      </div>
    </div>
  );
}
