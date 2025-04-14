import Dashboard from "@/components/Dashboard";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Dashboard />
    </main>
  );
}
