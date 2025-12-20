import React from 'react';
import { Wrench, Search, BarChart2, FileText, Database, Check, Clock } from 'lucide-react';

interface FunctionCallIndicatorProps {
  functionName: string;
  status: 'executing' | 'completed' | 'failed';
  result?: any;
}

export function FunctionCallIndicator({ functionName, status, result }: FunctionCallIndicatorProps) {
  const getIcon = () => {
    switch (functionName) {
      case 'search_vector_database': return <Search className="w-4 h-4" />;
      case 'get_statistics': return <BarChart2 className="w-4 h-4" />;
      case 'summarize_content': return <FileText className="w-4 h-4" />;
      case 'export_data': return <Database className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (functionName) {
      case 'search_vector_database': return 'Searching database...';
      case 'get_statistics': return 'Fetching statistics...';
      case 'summarize_content': return 'Generating summary...';
      case 'export_data': return 'Exporting data...';
      default: return `Executing ${functionName}...`;
    }
  };

  const completedLabel = () => {
    switch (functionName) {
      case 'search_vector_database': return 'Found relevant documents';
      case 'get_statistics': return 'Statistics retrieved';
      case 'summarize_content': return 'Summary generated';
      case 'export_data': return 'Data exported';
      default: return 'Action completed';
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 my-2 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 max-w-fit animate-in fade-in slide-in-from-left-2">
      <div className={`p-1.5 rounded-md ${
        status === 'completed' 
          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      }`}>
        {getIcon()}
      </div>
      
      <div className="flex flex-col">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {status === 'completed' ? completedLabel() : getLabel()}
        </span>
        {status === 'executing' && (
          <span className="text-xs text-gray-500 animate-pulse">Running...</span>
        )}
      </div>

      {status === 'completed' && (
        <Check className="w-4 h-4 text-green-500 ml-2" />
      )}
      
      {status === 'executing' && (
        <Clock className="w-4 h-4 text-blue-500 ml-2 animate-spin duration-3000" />
      )}
    </div>
  );
}
