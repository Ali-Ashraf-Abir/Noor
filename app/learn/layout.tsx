import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/guards/ProtectedRoute";

export default function learnLayout({ children }: { children: React.ReactNode }) {
  return (
   <ProtectedRoute>
     <div className="min-h-screen pattern-bg relative">
      <div className="relative z-10">{children}</div>
    </div>
   </ProtectedRoute>
  );
}