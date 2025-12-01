import React, { useState } from 'react';
import { BankEmail, EmailStatus, Priority, Role, User } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Activity, 
  FileText, 
  Search, 
  Plus, 
  X,
  Briefcase,
  CheckSquare,
  LayoutDashboard,
  Trash2,
  Share2,
  Bell
} from 'lucide-react';
import ForwardModal from './ForwardModal';
import ReminderModal from './ReminderModal';

interface BossDashboardProps {
  emails: BankEmail[];
  users: User[];
  currentUser: User;
  onAddUser: (name: string, role: Role) => void;
  onDeleteUser: (userId: string) => void;
  onForward: (emailId: string, recipient: string, note: string) => void;
  onSetReminder: (emailId: string, date: Date, note: string) => void;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

const BossDashboard: React.FC<BossDashboardProps> = ({ emails, users, currentUser, onAddUser, onDeleteUser, onForward, onSetReminder }) => {
  const [selectedEmail, setSelectedEmail] = useState<BankEmail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTeamTab, setActiveTeamTab] = useState<Role>(Role.WORKER);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', role: Role.WORKER });

  // Metric calculations
  const totalEmails = emails.length;
  const pending = emails.filter(e => e.status !== EmailStatus.COMPLETED).length;
  const urgent = emails.filter(e => e.priority === Priority.URGENT && e.status !== EmailStatus.COMPLETED).length;
  const completed = emails.filter(e => e.status === EmailStatus.COMPLETED).length;

  // Department specific queues (simulating portals)
  const fieldWorkQueue = emails.filter(e => e.status === EmailStatus.ASSIGNED || e.status === EmailStatus.IN_PROGRESS);
  const supervisorQueue = emails.filter(e => e.status === EmailStatus.PENDING_APPROVAL);
  const adminQueue = emails.filter(e => e.status === EmailStatus.APPROVED);

  // Chart Data Preparation
  const statusData = [
    { name: 'Assigned', value: emails.filter(e => e.status === EmailStatus.ASSIGNED).length },
    { name: 'In Review', value: emails.filter(e => e.status === EmailStatus.PENDING_APPROVAL).length },
    { name: 'Approved', value: emails.filter(e => e.status === EmailStatus.APPROVED).length },
    { name: 'Completed', value: emails.filter(e => e.status === EmailStatus.COMPLETED).length },
  ];

  const categoryData = emails.reduce((acc: any[], curr) => {
    const existing = acc.find(x => x.name === curr.category);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: curr.category, value: 1 });
    }
    return acc;
  }, []);

  // Filter users based on active tab
  const filteredUsers = users.filter(u => u.role === activeTeamTab);

  // Helper to get stats for a user
  const getUserStats = (user: User) => {
      if (user.role === Role.WORKER) {
          const userEmails = emails.filter(e => e.assignedWorkerId === user.id);
          const completed = userEmails.filter(e => e.status === EmailStatus.COMPLETED).length;
          const active = userEmails.filter(e => e.status !== EmailStatus.COMPLETED).length;
          return { active, completed, label: 'Tasks' };
      }
      
      // For Supervisor/Admin, count history actions to show activity level
      const actions = emails.reduce((acc, email) => {
         return acc + email.history.filter(h => h.actor === user.name).length;
      }, 0);
      
      const label = user.role === Role.SUPERVISOR ? 'Reviews' : 'Archives';
      return { active: 0, completed: 0, actions, label };
  };

  // Search Filtering Logic
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    const subjectMatch = email.subject.toLowerCase().includes(query);
    const senderMatch = email.sender.toLowerCase().includes(query);
    const bankMatch = email.bankName.toLowerCase().includes(query);
    const reportMatch = email.reportContent ? email.reportContent.toLowerCase().includes(query) : false;

    return subjectMatch || senderMatch || bankMatch || reportMatch;
  });

  const displayedEmails = searchQuery ? filteredEmails : emails.slice(0, 6);

  const handleAddUserSubmit = () => {
    if (newUserForm.name.trim()) {
      onAddUser(newUserForm.name, newUserForm.role);
      setNewUserForm({ name: '', role: Role.WORKER });
      setIsAddUserModalOpen(false);
    }
  };

  const handleForwardSend = (recipient: string, note: string) => {
    if (selectedEmail) {
      onForward(selectedEmail.id, recipient, note);
    }
  };

  const handleSetReminder = (date: Date, note: string) => {
    if (selectedEmail) {
      onSetReminder(selectedEmail.id, date, note);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
      </div>
      <div className="flex items-center text-xs text-green-600 font-medium mt-2">
        <ArrowUpRight size={14} className="mr-1" />
        <span>{trend} vs last week</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Volume" value={totalEmails} icon={FileText} color="bg-blue-500" trend="+12%" />
        <StatCard title="Workflow Pending" value={pending} icon={Clock} color="bg-yellow-500" trend="-5%" />
        <StatCard title="Urgent Attention" value={urgent} icon={AlertTriangle} color="bg-red-500" trend="+2%" />
        <StatCard title="Completed" value={completed} icon={CheckCircle} color="bg-green-500" trend="+8%" />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Pipeline Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Categories</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Operations Monitor - Visualizing the 3 Portals */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <LayoutDashboard className="mr-2 text-slate-500" size={24}/>
          Live Operations Center
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Field Worker Portal View */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 flex flex-col h-96">
              <div className="p-4 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                      <Briefcase size={18} className="text-blue-600" />
                      <h3 className="font-bold text-slate-800">Field Operations</h3>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">{fieldWorkQueue.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {fieldWorkQueue.map(email => (
                      <div key={email.id} onClick={() => setSelectedEmail(email)} className="p-3 border border-slate-100 rounded-lg hover:border-blue-300 cursor-pointer bg-white transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-slate-500">{email.bankName}</span>
                              {email.priority === Priority.URGENT && <AlertTriangle size={12} className="text-red-500" />}
                          </div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{email.subject}</p>
                          <div className="mt-2 flex items-center text-xs text-slate-400">
                              <img src={users.find(u => u.id === email.assignedWorkerId)?.avatar} className="w-5 h-5 rounded-full mr-2" />
                              <span>{users.find(u => u.id === email.assignedWorkerId)?.name || 'Unassigned'}</span>
                          </div>
                      </div>
                  ))}
                  {fieldWorkQueue.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <Briefcase size={24} className="mb-2 opacity-20"/>
                      No active field work
                    </div>
                  )}
              </div>
          </div>

          {/* Supervisor Portal View */}
          <div className="bg-white rounded-xl shadow-sm border border-yellow-100 flex flex-col h-96">
              <div className="p-4 border-b border-yellow-100 bg-yellow-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                      <CheckSquare size={18} className="text-yellow-600" />
                      <h3 className="font-bold text-slate-800">Supervisor Review</h3>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold">{supervisorQueue.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {supervisorQueue.map(email => (
                      <div key={email.id} onClick={() => setSelectedEmail(email)} className="p-3 border border-slate-100 rounded-lg hover:border-yellow-300 cursor-pointer bg-white transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-slate-500">{email.bankName}</span>
                              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">Pending</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{email.subject}</p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">Report by: {users.find(u => u.id === email.assignedWorkerId)?.name}</p>
                      </div>
                  ))}
                  {supervisorQueue.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <CheckSquare size={24} className="mb-2 opacity-20"/>
                      Queue empty
                    </div>
                  )}
              </div>
          </div>

          {/* Admin Portal View */}
          <div className="bg-white rounded-xl shadow-sm border border-green-100 flex flex-col h-96">
              <div className="p-4 border-b border-green-100 bg-green-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                      <FileText size={18} className="text-green-600" />
                      <h3 className="font-bold text-slate-800">Office Admin</h3>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">{adminQueue.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {adminQueue.map(email => (
                      <div key={email.id} onClick={() => setSelectedEmail(email)} className="p-3 border border-slate-100 rounded-lg hover:border-green-300 cursor-pointer bg-white transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-slate-500">{email.bankName}</span>
                              <CheckCircle size={12} className="text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{email.subject}</p>
                          <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-1 rounded">
                              Ready for Archiving
                          </div>
                      </div>
                  ))}
                  {adminQueue.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <FileText size={24} className="mb-2 opacity-20"/>
                      Nothing to archive
                    </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Management Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div className="flex items-center space-x-2">
                <Users className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Team Management</h3>
             </div>
             
             <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                {[Role.WORKER, Role.SUPERVISOR, Role.ADMIN].map(role => (
                   <button
                     key={role}
                     onClick={() => setActiveTeamTab(role)}
                     className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                       activeTeamTab === role ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                     }`}
                   >
                     {role === Role.WORKER ? 'Field Workers' : role === Role.SUPERVISOR ? 'Supervisors' : 'Admins'}
                   </button>
                ))}
             </div>

             <button 
               onClick={() => setIsAddUserModalOpen(true)}
               className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
             >
               <Plus size={16} className="mr-1" /> Add Member
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto max-h-[400px]">
             {filteredUsers.length > 0 ? (
               filteredUsers.map(user => {
                 const stats = getUserStats(user);
                 return (
                   <div key={user.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between group hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                            {user.role === Role.WORKER && (
                               <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                 user.status === 'Available' ? 'bg-green-500' : user.status === 'Busy' ? 'bg-red-500' : 'bg-slate-400'
                               }`} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{user.name}</h4>
                            {user.role === Role.WORKER ? (
                              <div className="flex space-x-3 text-xs text-slate-500 mt-1">
                                 <span>Active: <strong className="text-blue-600">{stats.active}</strong></span>
                                 <span>Done: <strong className="text-green-600">{stats.completed}</strong></span>
                              </div>
                            ) : (
                               <div className="flex space-x-3 text-xs text-slate-500 mt-1">
                                 <span>{stats.label}: <strong className="text-blue-600">{stats.actions}</strong></span>
                               </div>
                            )}
                          </div>
                      </div>
                      <button 
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove User"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                 );
               })
             ) : (
               <div className="col-span-2 text-center py-8 text-slate-400">
                 No {activeTeamTab.toLowerCase().replace('_', ' ')}s found. Add one to get started!
               </div>
             )}
          </div>
        </div>

        {/* Audit Log / Detail Panel */}
        <div className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-6 flex flex-col h-[500px]">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-2">
                <Activity className="text-blue-400" size={20} />
                <h3 className="text-lg font-bold">Audit Trail</h3>
             </div>
             {selectedEmail && (
                 <div className="flex space-x-2">
                   <button 
                     onClick={() => setIsReminderModalOpen(true)}
                     className="text-xs flex items-center px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-colors"
                     title="Set Follow-up Reminder"
                   >
                     <Bell size={12} className="mr-1" /> Reminder
                   </button>
                   <button 
                     onClick={() => setIsForwardModalOpen(true)}
                     className="text-xs flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white transition-colors"
                   >
                     <Share2 size={12} className="mr-1" /> Forward
                   </button>
                 </div>
             )}
           </div>
           
           {selectedEmail ? (
             <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <div>
                   <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-1">Email ID</h4>
                   <p className="font-mono text-blue-300">{selectedEmail.id}</p>
                </div>
                <div>
                   <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-1">Workflow History</h4>
                   <div className="relative border-l border-slate-700 ml-2 space-y-6 pt-1">
                      {selectedEmail.history.map((event, i) => (
                        <div key={i} className="pl-6 relative">
                          <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                          <p className="text-sm font-semibold text-white">{event.action}</p>
                          <p className="text-xs text-slate-400">{event.actor}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{event.date.toLocaleTimeString()} - {event.date.toLocaleDateString()}</p>
                        </div>
                      ))}
                   </div>
                </div>
                {selectedEmail.reportContent && (
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-1">Report Content</h4>
                    <div className="bg-slate-800 p-3 rounded text-xs text-slate-300 border border-slate-700 font-mono whitespace-pre-wrap">
                      {selectedEmail.reportContent}
                    </div>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center text-slate-500 text-center">
               <p>Select an email from the live monitor to view its complete audit trail.</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Search Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h3 className="text-lg font-bold text-slate-800">
               {searchQuery ? `Search Results (${filteredEmails.length})` : 'Recent Bank Correspondence'}
             </h3>
             <div className="relative w-full sm:w-64">
               <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search emails, subjects, reports..."
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            {displayedEmails.length > 0 ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-6 py-4">Bank</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedEmails.map(email => (
                    <tr 
                      key={email.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedEmail?.id === email.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{email.bankName}</td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        {email.subject}
                        {searchQuery && email.reportContent?.toLowerCase().includes(searchQuery.toLowerCase()) && (
                           <span className="block text-[10px] text-blue-500 font-mono mt-1">Matched in Report</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${email.status === EmailStatus.COMPLETED ? 'bg-green-100 text-green-800' : 
                            email.status === EmailStatus.PENDING_APPROVAL ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {email.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold ${email.priority === Priority.URGENT ? 'text-red-600' : 'text-slate-500'}`}>
                          {email.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Search size={32} className="mx-auto mb-2 text-slate-300" />
                <p>No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Add Team Member</h3>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                   type="text" 
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   value={newUserForm.name}
                   onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                   placeholder="e.g. Jane Doe"
                   autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   value={newUserForm.role}
                   onChange={e => setNewUserForm({...newUserForm, role: e.target.value as Role})}
                >
                  <option value={Role.WORKER}>Field Worker</option>
                  <option value={Role.SUPERVISOR}>Supervisor</option>
                  <option value={Role.ADMIN}>Office Admin</option>
                </select>
                {newUserForm.role === Role.WORKER && (
                  <p className="text-xs text-slate-500 mt-1">New workers are set to "Available" by default.</p>
                )}
              </div>
              <button 
                 onClick={handleAddUserSubmit}
                 disabled={!newUserForm.name.trim()}
                 className={`w-full py-2.5 rounded-lg font-medium mt-2 transition-colors ${
                    newUserForm.name.trim() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                 }`}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      <ForwardModal 
          isOpen={isForwardModalOpen}
          onClose={() => setIsForwardModalOpen(false)}
          onSend={handleForwardSend}
          users={users}
          currentUserId={currentUser.id}
      />

      <ReminderModal 
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          onSet={handleSetReminder}
          subject={selectedEmail?.subject}
      />
    </div>
  );
};

export default BossDashboard;