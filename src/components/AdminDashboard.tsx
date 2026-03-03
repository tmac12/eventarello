import { useState } from 'react';
import UploadForm from './UploadForm';
import AdminEventList from './AdminEventList';

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <UploadForm onEventCreated={() => setRefreshKey((k) => k + 1)} />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <AdminEventList refreshKey={refreshKey} />
      </section>
    </div>
  );
}
