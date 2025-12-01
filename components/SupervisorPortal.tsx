import React, { useState } from 'react';
import { BankEmail, EmailStatus, User, Role } from '../types';
import { Check, X, User as UserIcon, MessageSquare, ArrowRightLeft, Share2 } from 'lucide-react';
import ForwardModal from './ForwardModal';

interface SupervisorPortalProps {
  emails: BankEmail[];
  workers: User[];
  currentUser: User;
  onUpdateEmail: (id: string, updates: Partial<BankEmail>) => void;
  onForward: (emailId: string, recipient: string, note: string) => void;
}

const SupervisorPortal: React.FC<SupervisorPortalProps> = ({ emails, workers, currentUser, onUpdateEmail, onForward }) => {
  const [selectedEmail, setSelectedEmail] = useState<BankEmail | null>(null);
  const [comment, setComment] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  // Filter for pending approvals AND rejected items (so supervisor can see what they sent back if needed, but primary focus is pending)
  const pendingApprovals = emails.filter(e => e.status === EmailStatus.PENDING_APPROVAL);

  const handleAction = (status: EmailStatus) => {
    if (!selectedEmail) return;
    onUpdateEmail(selectedEmail.id, {
      status,
      supervisorComments: comment
    });
    setSelectedEmail(null);
    setComment('');
  };

  const handleReassign = (workerId: string) => {
    if (!selectedEmail) return;
    onUpdateEmail(selectedEmail.id, {
      status: EmailStatus.ASSIGNED, // Reset status to assigned so worker can work on it
      assignedWorkerId: workerId,
      supervisorComments: `Reassigned by supervisor. Note: ${comment}`
    });
    setSelectedEmail(null);
    setComment('');
    setIsReassigning(false);
  }

  const handleForwardSend = (recipient: string, note: string) => {
    if (selectedEmail) {
      onForward(selectedEmail.id, recipient, note);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
       <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700">Approval Queue</h2>
          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">{pendingApprovals.length}</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
           {pendingApprovals.length === 0 && <div className="text-center p-8 text-slate-400">No pending approvals.</div>}
           {pendingApprovals.map(email => (
             <div 
               key={email.id}
               onClick={() => { setSelectedEmail(email); setIsReassigning(false); }}
               className={`p-4 rounded-lg cursor-pointer transition-all border ${
                 selectedEmail?.id === email.id ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-white border-slate-100 hover:border-yellow-200'
               }`}
             >
               <div className="flex items-center text-xs text-slate-500 mb-2">
                 <UserIcon size={12} className="mr-1" />
                 Worker {email.assignedWorkerId?.replace('worker-', '')}
               </div>
               <h3 className="text-sm font-semibold text-slate-800">{email.subject}</h3>
               <p className="text-xs text-slate-400 mt-1">{email.category}</p>
             </div>
           ))}
        </div>
       </div>

       <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
         {selectedEmail ? (
           <div className="flex-1 flex flex-col">
             <div className="p-6 border-b border-slate-100 bg-slate-50">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Original Email</h3>
                   <div className="bg-white p-3 rounded border border-slate-200 text-sm text-slate-600">
                     <p><strong>From:</strong> {selectedEmail.sender}</p>
                     <p className="mt-1">{selectedEmail.body}</p>
                   </div>
                 </div>
                 <div className="ml-4 flex flex-col space-y-2">
                    <button 
                      onClick={() => setIsReassigning(!isReassigning)}
                      className="text-xs flex items-center justify-center w-24 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 transition-colors"
                    >
                      <ArrowRightLeft size={12} className="mr-1" /> Reassign
                    </button>
                    <button 
                      onClick={() => setIsForwardModalOpen(true)}
                      className="text-xs flex items-center justify-center w-24 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                    >
                      <Share2 size={12} className="mr-1" /> Forward
                    </button>
                 </div>
               </div>
               
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Field Worker Report</h3>
               <div className="bg-yellow-50 p-4 rounded border border-yellow-100 text-sm text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                 {selectedEmail.reportContent}
               </div>
             </div>

             <div className="p-6 mt-auto bg-white border-t border-slate-100 relative">
               {isReassigning ? (
                 <div className="absolute inset-0 bg-white p-6 z-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-800">Select New Worker</h3>
                       <button onClick={() => setIsReassigning(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {workers.filter(w => w.role === Role.WORKER && w.id !== selectedEmail.assignedWorkerId).map(worker => (
                        <button 
                          key={worker.id}
                          onClick={() => handleReassign(worker.id)}
                          className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all text-left group"
                        >
                          <img src={worker.avatar} alt="" className="w-8 h-8 rounded-full mr-3" />
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-blue-700">{worker.name}</p>
                            <p className="text-xs text-slate-500">{worker.status || 'Offline'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                 </div>
               ) : (
                 <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Supervisor Feedback / Instructions</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute top-3 left-3 text-slate-400" />
                    <input 
                      type="text" 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Add comments here (required for rejection)..."
                    />
                  </div>
                  <div className="flex space-x-4 mt-4">
                    <button 
                      onClick={() => handleAction(EmailStatus.REJECTED)}
                      className="flex-1 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center font-medium transition-colors"
                    >
                      <X size={18} className="mr-2" /> Reject & Request Revision
                    </button>
                    <button 
                      onClick={() => handleAction(EmailStatus.APPROVED)}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center font-medium shadow-md transition-transform active:scale-95"
                    >
                      <Check size={18} className="mr-2" /> Approve & Forward
                    </button>
                  </div>
                 </>
               )}
             </div>
           </div>
         ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
             <p>Select a report to review</p>
          </div>
         )}
       </div>

       <ForwardModal 
          isOpen={isForwardModalOpen}
          onClose={() => setIsForwardModalOpen(false)}
          onSend={handleForwardSend}
          users={workers}
          currentUserId={currentUser.id}
       />
    </div>
  );
};

export default SupervisorPortal;