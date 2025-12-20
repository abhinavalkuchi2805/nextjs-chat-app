'use client';

import { CheckCircle } from 'lucide-react';

interface UploadStatusProps {
  status: string;
  loading: boolean;
}

export function UploadStatus({ status, loading }: UploadStatusProps) {
  if (!status) return null;

  return (
    <div className="px-6 py-3 flex items-center gap-3 glass-strong animate-fade-in-up">
      {loading ? (
        <div className="w-5 h-5 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin"></div>
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-400" />
      )}
      <span className={`text-sm font-medium ${loading ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {status}
      </span>
    </div>
  );
}
