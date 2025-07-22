import Link from "next/link";
import { FaTachometerAlt, FaCalendarAlt, FaUserMd } from "react-icons/fa";

const navItems = [
  { label: "Dashboard", href: "/Doctor/Dashboard", icon: <FaTachometerAlt /> },
  { label: "Appointments", href: "/Doctor/Appointments", icon: <FaCalendarAlt /> },
  { label: "Calendar", href: "/Doctor/Calendar", icon: <FaUserMd /> },
];

export default function SidebarDoctor() {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-6 dark:bg-slate-900 dark:text-white">
      <nav className="flex flex-col gap-6">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-teal-600 transition">
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
