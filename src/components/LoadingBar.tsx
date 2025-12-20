interface LoadingBarProps {
  loading: boolean;
}

export function LoadingBar({ loading }: LoadingBarProps) {
  if (!loading) return null;

  return (
    <div className="h-0.5 bg-[var(--surface)] overflow-hidden">
      <div 
        className="h-full"
        style={{ 
          width: '30%',
          animation: 'shimmer 1.5s infinite',
          backgroundSize: '200% 100%',
          background: 'var(--accent-gradient-solid)'
        }} 
      />
    </div>
  );
}
