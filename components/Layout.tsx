import React, { useState } from 'react';
import { User, Role, AppNotification, BankEmail } from '../types';
import ChatAssistant from './ChatAssistant';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  Bell, 
  Menu,
  Shield,
  Circle,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  notifications: AppNotification[];
  // Data for Chatbot context
  allEmails: BankEmail[]; 
  allUsers: User[];
  onRoleSwitch: (role: Role) => void;
  onStatusChange?: (status: 'Available' | 'Busy' | 'Offline') => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentUser, 
  notifications,
  allEmails,
  allUsers, 
  onRoleSwitch, 
  onStatusChange,
  onMarkAsRead,
  onClearAll 
}) => {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [isStatusMenuOpen, setStatusMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = React.useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const NavItem = ({ role, icon: Icon, label, active }: any) => {
    const isActive = currentUser.role === role;
    return (
      <button
        onClick={() => { onRoleSwitch(role); setNotificationsOpen(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span className={!isSidebarOpen ? 'hidden' : ''}>{label}</span>
        {isActive && isSidebarOpen && <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />}
      </button>
    );
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Available': return 'text-green-500';
      case 'Busy': return 'text-red-500';
      case 'Offline': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'alert': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700 h-16">
          <div className={`flex items-center space-x-2 ${!isSidebarOpen && 'justify-center w-full'}`}>
            <Shield className="text-blue-500" size={28} />
            {isSidebarOpen && <span className="font-bold text-xl tracking-tight">Surg<span className="text-blue-500">ex</span></span>}
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          <div className={`text-xs font-semibold text-slate-500 uppercase px-4 mb-2 ${!isSidebarOpen && 'hidden'}`}>
            Access System Portals
          </div>
          <NavItem role={Role.BOSS} icon={LayoutDashboard} label="Boss Dashboard" />
          <NavItem role={Role.WORKER} icon={Briefcase} label="Field Worker" />
          <NavItem role={Role.SUPERVISOR} icon={CheckSquare} label="Supervisor" />
          <NavItem role={Role.ADMIN} icon={FileText} label="Office Admin" />
        </div>

        <div className="p-4 border-t border-slate-700">
           <button 
             onClick={() => setSidebarOpen(!isSidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded hover:bg-slate-800 text-slate-400"
           >
             <Menu size={20} />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800 hidden md:block">
            {currentUser.role === Role.BOSS && "Executive Overview"}
            {currentUser.role === Role.WORKER && "My Workspace"}
            {currentUser.role === Role.SUPERVISOR && "Approval Queue"}
            {currentUser.role === Role.ADMIN && "Document Center"}
          </h1>
          
          <div className="flex items-center space-x-4 ml-auto">
            {/* Worker Status Toggle */}
            {currentUser.role === Role.WORKER && onStatusChange && (
              <div className="relative">
                <button 
                  onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <Circle size={10} className={`fill-current ${getStatusColor(currentUser.status)}`} />
                  <span className="text-sm font-medium text-slate-700">{currentUser.status || 'Offline'}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                
                {isStatusMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                    {['Available', 'Busy', 'Offline'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(status as any);
                          setStatusMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                      >
                         <Circle size={8} className={`fill-current ${getStatusColor(status)}`} />
                         <span>{status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-full relative transition-colors ${isNotificationsOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-700 text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                      <button onClick={onClearAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                     {notifications.length === 0 ? (
                       <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                         <Bell size={24} className="mb-2 opacity-20" />
                         No new notifications
                       </div>
                     ) : (
                       notifications.map(n => (
                         <div 
                           key={n.id} 
                           onClick={() => onMarkAsRead(n.id)}
                           className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 ${!n.read ? 'bg-blue-50/40' : ''}`}
                         >
                            <div className="mt-1 flex-shrink-0">
                               {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>{n.title}</p>
                               <p className="text-xs text-slate-500 mt-0.5 break-words">{n.message}</p>
                               <p className="text-[10px] text-slate-400 mt-1.5">{n.timestamp.toLocaleTimeString()}</p>
                            </div>
                            {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>}
                         </div>
                       ))
                     )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role.toLowerCase()}</p>
              </div>
              <img 
                src={currentUser.avatar} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-6 relative">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>

        {/* AI Chat Assistant */}
        <ChatAssistant 
          emails={allEmails}
          users={allUsers}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
};

export default Layout;