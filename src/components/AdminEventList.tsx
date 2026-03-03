import { useState, useEffect } from 'react';
import type { Event } from '../lib/types';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function AdminEventList({ refreshKey }: { refreshKey: number }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', event_date: '', location: '', description: '', status: '' as 'draft' | 'published' });

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch('/api/events?all=true');
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [refreshKey]);

  async function handleDelete(event: Event) {
    if (!confirm(`Eliminare "${event.title}"?`)) return;
    const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
    if (res.ok) fetchEvents();
  }

  function startEdit(event: Event) {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      event_date: event.event_date.slice(0, 16),
      location: event.location,
      description: event.description || '',
      status: event.status as 'draft' | 'published',
    });
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        event_date: new Date(editForm.event_date).toISOString(),
        description: editForm.description || undefined,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchEvents();
    }
  }

  async function toggleStatus(event: Event) {
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchEvents();
  }

  if (loading) {
    return <div className="text-center py-8 text-text-muted">Caricamento eventi...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p className="text-lg">Nessun evento</p>
        <p className="text-sm mt-1">Carica una locandina per creare il primo evento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Eventi ({events.length})</h2>
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {editingId === event.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Titolo"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="datetime-local"
                    value={editForm.event_date}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Luogo"
                  />
                </div>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="Descrizione"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    Annulla
                  </button>
                  <button onClick={() => handleUpdate(event.id)} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark cursor-pointer">
                    Salva
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-16 h-16 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{event.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      event.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status === 'published' ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">{formatDate(event.event_date)}</p>
                  <p className="text-sm text-text-muted">{event.location}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => toggleStatus(event)}
                    title={event.status === 'published' ? 'Nascondi' : 'Pubblica'}
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    {event.status === 'published' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M15 12a3 3 0 01-3 3m0 0l6.878 6.878" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(event)}
                    title="Modifica"
                    className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
                    title="Elimina"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
