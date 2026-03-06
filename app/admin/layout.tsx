import ProtectedRoute from "@/guards/ProtectedRoute";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pattern-bg relative">
      <ProtectedRoute adminOnly><div className="relative z-10">{children}</div></ProtectedRoute>
    </div>
  );
}