import ChatUI from '@/components/ChatUI';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatUI />
    </ProtectedRoute>
  );
}
