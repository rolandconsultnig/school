import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bus,
  ArrowUpCircle,
  CalendarCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  MessageSquare,
  School,
  Settings,
  Shield,
  UserPlus,
  Users,
  Wallet,
  ClipboardList,
  IdCard,
} from "lucide-react";
import type { ProfileType } from "../types";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export function getNavigation(
  profileType: ProfileType,
  roleCode?: string
): NavSection[] {
  if (profileType === "STUDENT") {
    return [
      {
        title: "Home",
        items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true }],
      },
      {
        title: "Learning",
        items: [
          { to: "/learn/courses", label: "My courses", icon: BookOpen },
          { to: "/learn/assignments", label: "Assignments", icon: ClipboardList },
          { to: "/learn/exams", label: "Exams", icon: GraduationCap },
          { to: "/learn/gradebook", label: "Gradebook", icon: School },
        ],
      },
      {
        title: "Services",
        items: [
          { to: "/services/fees", label: "Fees & ledger", icon: CreditCard },
          { to: "/services/register", label: "Registration", icon: UserPlus },
          { to: "/services/documents", label: "Documents", icon: FileText },
        ],
      },
      {
        title: "Campus life",
        items: [
          { to: "/campus/attendance", label: "Attendance", icon: CalendarCheck },
          { to: "/campus/library", label: "Library", icon: Library },
          { to: "/campus/wallet", label: "Campus wallet", icon: Wallet },
          { to: "/campus/access", label: "Access log", icon: Shield },
          { to: "/campus/transport", label: "Bus tracker", icon: Bus },
        ],
      },
      {
        title: "Community",
        items: [
          { to: "/community", label: "PTA & notices", icon: MessageSquare },
          { to: "/messages", label: "Messages", icon: MessageSquare },
        ],
      },
    ];
  }

  if (profileType === "PARENT") {
    return [
      {
        title: "Family",
        items: [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
          { to: "/messages", label: "Messages", icon: MessageSquare },
        ],
      },
    ];
  }

  const academic: NavItem[] = [
    { to: "/students", label: "Students", icon: Users },
    { to: "/classes", label: "Classes", icon: School },
    { to: "/admissions", label: "Admissions", icon: UserPlus },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/learn/courses", label: "Learning", icon: BookOpen },
  ];

  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true }],
    },
    { title: "Academic", items: academic },
  ];

  if (profileType === "ADMIN" || roleCode === "SCHOOL_ADMIN" || roleCode === "SUPER_ADMIN") {
    sections.push({
      title: "Operations",
      items: [
        { to: "/finance", label: "Finance", icon: Wallet },
        { to: "/hr", label: "HR & payroll", icon: Users },
        { to: "/id-cards", label: "ID cards", icon: IdCard },
        { to: "/library", label: "Library", icon: Library },
        { to: "/access", label: "Access", icon: Shield },
        { to: "/ancillary", label: "Transport & meals", icon: Bus },
        { to: "/community", label: "PTA community", icon: MessageSquare },
      ],
    });
    sections.push({
      title: "Administration",
      items: [
        { to: "/teachers", label: "Teachers", icon: Users },
        { to: "/promotion", label: "Promotion", icon: ArrowUpCircle },
        { to: "/settings", label: "Settings", icon: Settings },
      ],
    });
  }

  if (roleCode === "ACCOUNTANT") {
    sections.push({
      title: "Finance",
      items: [{ to: "/finance", label: "Finance", icon: CreditCard }],
    });
  }

  if (roleCode === "LIBRARIAN") {
    sections.push({
      title: "Library",
      items: [{ to: "/library", label: "Library", icon: Library }],
    });
  }

  if (roleCode === "SECURITY_GUARD") {
    sections.push({
      title: "Security",
      items: [{ to: "/access", label: "Access monitor", icon: Shield }],
    });
  }

  return sections;
}
