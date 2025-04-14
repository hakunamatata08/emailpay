import Navbar from "@/components/Navbar";
import ContactsPage from "@/components/ContactsPage";

export default function Contacts() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <ContactsPage />
    </main>
  );
}
