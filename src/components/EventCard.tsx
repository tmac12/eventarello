import { useState, useEffect } from 'react';
import type { Event } from '../lib/types';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function EventCard({ event, position, past }: { event: Event; position: 'left' | 'right'; past?: boolean }) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (!showFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowFullscreen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showFullscreen]);

  return (
    <>
      <div className={`flex items-start gap-4 md:gap-8 ${
        position === 'right' ? 'md:flex-row-reverse' : ''
      }`}>
        {/* Card */}
        <div className={`flex-1 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow ${past ? 'opacity-60' : ''}`}>
          <button
            type="button"
            onClick={() => setShowFullscreen(true)}
            className="w-full cursor-zoom-in"
          >
            <img
              src={event.image_url}
              alt={event.title}
              loading="lazy"
              className="w-full h-48 object-cover"
            />
          </button>
          <div className="p-4 space-y-2">
            <h3 className="text-lg font-bold text-text">{event.title}</h3>
            <div className="flex items-center gap-1.5 text-sm text-text-muted">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="capitalize">{formatDate(event.event_date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-text-muted">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
            {event.url && (
              <div className="flex items-center gap-1.5 text-sm">
                <svg className="w-4 h-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {event.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
            {event.description && (
              <p className="text-sm text-text-muted pt-1">{event.description}</p>
            )}
          </div>
        </div>

        {/* Spacer for the other side on desktop */}
        <div className="hidden md:block flex-1" />
      </div>

      {/* Fullscreen overlay */}
      {showFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer"
            aria-label="Chiudi"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={event.image_url}
            alt={event.title}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
