import React, { useState } from 'react';
import { BankEmail, EmailStatus, Priority, User } from '../types';
import { FileText, Paperclip, Send, Clock, AlertCircle, UploadCloud, X, Share2 } from 'lucide-react';
import ForwardModal from './ForwardModal';

interface WorkerPortalProps {
  emails: BankEmail[];
  currentUserId: string;
  users: User[];
  onUpdateEmail: (id: string, updates: Partial<BankEmail>) => void;
  onForward: (emailId: string, recipient: string, note: string) => void;
}

const WorkerPortal: React.FC<WorkerPortalProps> = ({ emails, currentUserId, users, onUpdateEmail, onForward }) => {
  const [selectedEmail, setSelectedEmail] = useState<BankEmail | null>(null);
  const [reportText, setReportText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  // Filter emails assigned to this worker
  const myTasks = emails.filter(e => e.assignedWorkerId === currentUserId && e.status !== EmailStatus.COMPLETED);

  const handleSelect = (email: BankEmail) => {
    setSelectedEmail(email);
    setAttachments([]);
    // Pre-fill template if empty
    if (!email.reportContent) {
      setReportText(`REPORT FOR: ${email.category}\n\nSUMMARY:\n[Auto-generated summary of ${email.subject}]\n\nACTION TAKEN:\n- Reviewed attachments\n- Verified transaction details\n\nNOTES:\n`);
    } else {
      setReportText(email.reportContent);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedEmail) return;
    
    // In a real app, we would upload files to server here and get URLs
    // For prototype, we just append filenames to history
    onUpdateEmail(selectedEmail.id, {
      status: EmailStatus.PENDING_APPROVAL,
      reportContent: reportText,
      // Just simulating adding attachments info
    });
    setSelectedEmail(null);
  };

  const handleForwardSend = (recipient: string, note: string) => {
    if (selectedEmail) {
      onForward(selectedEmail.id, recipient, note);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Task List */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700">My Assignments</h2>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">{myTasks.length}</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {myTasks.length === 0 && (
            <div className="text-center p-8 text-slate-400">No active assignments. Great job!</div>
          )}
          {myTasks.map(email => (
            <div 
              key={email.id}
              onClick={() => handleSelect(email)}
              className={`p-4 rounded-lg cursor-pointer transition-all border ${
                selectedEmail?.id === email.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-slate-100 hover:border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500">{email.bankName}</span>
                {email.priority === Priority.URGENT && <AlertCircle size={14} className="text-red-500" />}
              </div>
              <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{email.subject}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{email.body}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center"><Clock size={12} className="mr-1"/> 2h ago</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  email.status === EmailStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                }`}>
                  {email.status === EmailStatus.REJECTED ? 'Needs Revision' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                   <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedEmail.subject}</h2>
                   <div className="flex items-center space-x-4 text-sm text-slate-500">
                     <span className="flex items-center"><FileText size={16} className="mr-1"/> {selectedEmail.category}</span>
                     <span className="flex items-center"><Paperclip size={16} className="mr-1"/> {selectedEmail.attachments.length} Attachment(s)</span>
                   </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                   <button 
                     onClick={() => setIsForwardModalOpen(true)}
                     className="flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs font-medium transition-colors"
                   >
                     <Share2 size={14} className="mr-1" /> Forward
                   </button>
                   
                   {selectedEmail.status === EmailStatus.REJECTED && (
                     <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm border border-red-200">
                       <strong>Feedback:</strong> {selectedEmail.supervisorComments}
                     </div>
                   )}
                </div>
              </div>
              <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed font-mono">
                {selectedEmail.body}
              </div>
            </div>

            <div className="flex-1 p-6 flex flex-col overflow-y-auto">
              <label className="text-sm font-bold text-slate-700 mb-2">Report / Action Taken</label>
              <textarea 
                className="w-full min-h-[200px] border border-slate-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-yellow-50 font-sans mb-6"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Type your report here..."
              />

              <div className="border-t border-slate-100 pt-6">
                <label className="text-sm font-bold text-slate-700 mb-4 block">Supporting Documents</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center bg-slate-100 px-3 py-2 rounded-lg text-sm text-slate-700 border border-slate-200">
                      <Paperclip size={14} className="mr-2 text-slate-400" />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="ml-2 text-slate-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="cursor-pointer flex items-center px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors text-slate-500 text-sm">
                    <UploadCloud size={16} className="mr-2" />
                    Attach File
                    <input type="file" className="hidden" multiple onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">Save Draft</button>
              <button 
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center shadow-md transition-transform active:scale-95"
              >
                <Send size={18} className="mr-2" />
                Submit to Supervisor
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} />
            </div>
            <p>Select a task from the left to begin working</p>
          </div>
        )}
      </div>

      <ForwardModal 
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        onSend={handleForwardSend}
        users={users}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default WorkerPortal;