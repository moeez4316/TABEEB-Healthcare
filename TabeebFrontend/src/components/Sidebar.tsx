import Link from "next/link";
import Image from "next/image";
import { FaTachometerAlt, FaCalendarAlt, FaFileMedical, FaPills, FaRobot, FaImage } from "react-icons/fa";

const navItems = [
  { label: "Dashboard", href: "/Patient/dashboard", icon: <FaTachometerAlt /> },
  { label: "Appointments", href: "/Patient/appointments", icon: <FaCalendarAlt /> },
  { label: "Medical Records", href: "/Patient/medical-records", icon: <FaFileMedical /> },
  { label: "Medication", href: "/Patient/medication", icon: <FaPills /> },
  { label: "AI Chat", href: "/Patient/ai-chat", icon: <FaRobot /> },
  { label: "Image Analysis", href: "/Patient/image-analysis", icon: <FaImage /> },
];

export default function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-60 flex flex-col items-center py-8 shadow-lg border-r border-gray-200 dark:border-gray-800 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mb-10 flex flex-col items-center">
        <Image src="/tabeeb_logo.png" alt="Tabeeb Logo" width={64} height={64} className="mb-2 rounded-full shadow" />
        <span className="text-xl font-bold tracking-wide text-[#1e293b] dark:text-[#ededed]">TABEEB</span>
      </div>
      <nav className="w-full">
        <ul className="space-y-2 w-full">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-6 py-3 rounded-lg text-base font-medium text-[#1e293b] dark:text-[#ededed] hover:bg-[#f1f5f9] dark:hover:bg-[#171717] transition-colors w-full"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
