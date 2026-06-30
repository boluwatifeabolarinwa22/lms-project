import React from 'react';
import { BookOpen, User, LogOut, LayoutDashboard, Shield, AlertCircle, FileSpreadsheet, Settings, Compass } from 'lucide-react';

export default function Navbar({ user, currentPath, onNavigate, onLogout }) {
  if (!user) return null;

  const roleColors = {
    STUDENT: 'from-blue-500 to-indigo-500',
    INSTRUCTOR: 'from-purple-500 to-indigo-500',
    ADMIN: 'from-rose-500 to-red-500'
  };

  const navItems = {
    STUDENT: [
      { path: 'student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: 'student/courses', label: 'Course Catalog', icon: <Compass className="w-4 h-4" /> }
    ],
    INSTRUCTOR: [
      { path: 'instructor/dashboard', label: 'Class Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: 'instructor/courses', label: 'Course Builder', icon: <BookOpen className="w-4 h-4" /> },
      { path: 'instructor/alerts', label: 'Risk Alerts', icon: <AlertCircle className="w-4 h-4" /> }
    ],
    ADMIN: [
      { path: 'admin/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: 'admin/users', label: 'User Accounts', icon: <User className="w-4 h-4" /> },
      { path: 'admin/courses', label: 'Approvals', icon: <BookOpen className="w-4 h-4" /> },
      { path: 'admin/reports', label: 'Global Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
      { path: 'admin/config', label: 'System Settings', icon: <Settings className="w-4 h-4" /> }
    ]
  };

  const currentRoleItems = navItems[user.role] || [];
  const activeBadgeColor = roleColors[user.role] || 'from-slate-500 to-slate-600';

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate(currentRoleItems[0]?.path || 'login')}>
        <div className={`p-2 rounded-lg bg-gradient-to-tr ${activeBadgeColor} text-white shadow-md`}>
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900">
            EduPlus
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 block -mt-1">
            LMS Analytics
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {currentRoleItems.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path.split('/:')[0]);
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col text-right">
          <span className="text-sm font-semibold text-slate-800">{user.name}</span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 self-end">
            {user.role}
          </span>
        </div>
        <div className="w-[1px] h-8 bg-slate-200" />
        <button
          onClick={onLogout}
          className="flex items-center justify-center p-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-200"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
