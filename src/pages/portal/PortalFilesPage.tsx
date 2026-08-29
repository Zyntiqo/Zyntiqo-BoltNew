import { useEffect, useState, useMemo } from 'react';
import { FolderOpen, File as FileIcon } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '@/pages/app/DashboardPage';
import { filesApi, type ProjectFile } from '@/lib/services/portal';

export default function PortalFilesPage() {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const f = await filesApi.list();
      setFiles(f);
      setLoading(false);
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, ProjectFile[]> = {};
    for (const f of files) {
      const key = f.category || 'Uncategorized';
      if (!map[key]) map[key] = [];
      map[key].push(f);
    }
    return map;
  }, [files]);

  const categories = Object.keys(grouped).sort();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Files</h1>
        <p className="mt-1 text-sm text-ink-400">Documents and assets shared across your projects.</p>
      </div>

      {files.length === 0 ? (
        <Card>
          <CardHeader title="Project Files" icon={FolderOpen} />
          <EmptyState icon={FolderOpen} title="No files yet" subtitle="Files shared with you by the Zyntiqo team will appear here." />
        </Card>
      ) : (
        categories.map((cat) => (
          <Card key={cat}>
            <CardHeader title={cat} icon={FolderOpen} />
            <div className="space-y-2 px-3 pb-3">
              {grouped[cat].map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink-900/40 px-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                    <FileIcon className="h-4 w-4 text-brand-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{f.file_name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                      {f.file_type && <span className="uppercase">{f.file_type}</span>}
                      {f.file_size != null && <span>{formatSize(Number(f.file_size))}</span>}
                      <span>{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
