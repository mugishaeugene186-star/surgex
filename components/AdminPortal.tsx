import React, { useState } from 'react';
import { BankEmail, EmailStatus, User } from '../types';
import { Upload, Mail, CheckCircle, FileText, Download, Share2 } from 'lucide-react';
import ForwardModal from './ForwardModal';

interface AdminPortalProps {
  emails: BankEmail[];
  users: User[];
  currentUserId: string;
  onUpdateEmail: (id: string, updates: Partial<BankEmail>) => void;
  onForward: (emailId: string, recipient: string, note: string) => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ emails, users, currentUserId, onUpdateEmail, onForward }) => {
  const [selectedEmail, setSelectedEmail] = useState<BankEmail | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanFile, setScanFile] = useState<string | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  const approvedEmails = emails.filter(e => e.status === EmailStatus.APPROVED);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      // Simulate upload delay
      setTimeout(() => {
        setScanFile(e.target.files![0].name);
        setIsUploading(false);
      }, 1500);
    }
  };

  const handleFinalize = () => {
    if (!selectedEmail) return;
    onUpdateEmail(selectedEmail.id, {
      status: EmailStatus.COMPLETED
    });
    setSelectedEmail(null);
    setScanFile(null);
  };

  const handleForwardSend = (recipient: string, note: string) => {
    if (selectedEmail) {
      onForward(selectedEmail.id, recipient, note);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700">Ready for Archiving</h2>
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">{approvedEmails.length}</span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
           {approvedEmails.map(email => (
             <div 
               key={email.id}
               onClick={() => setSelectedEmail(email)}
               className={`p-4 rounded-lg cursor-pointer transition-all border ${
                 selectedEmail?.id === email.id ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-slate-100 hover:border-green-200'
               }`}
             >
               <h3 className="text-sm font-semibold text-slate-800">{email.subject}</h3>
               <div className="flex justify-between mt-2 text-xs text-slate-500">
                 <span>{email.bankName}</span>
                 <span className="text-green-600 font-medium">Approved</span>
               </div>
             </div>
           ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {selectedEmail ? (
          <div className="p-8 flex flex-col h-full relative">
             <div className="absolute top-6 right-6">
               <button 
                 onClick={() => setIsForwardModalOpen(true)}
                 className="flex items-center px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-xs font-medium transition-colors"
               >
                 <Share2 size={14} className="mr-1" /> Forward
               </button>
             </div>

             <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-800 mb-2">Finalize Documentation</h2>
               <p className="text-slate-500">Upload scanned copies of physical documents to complete this transaction.</p>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-8">
               <div className="p-4 border border-slate-200 rounded-lg">
                 <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center"><FileText size={16} className="mr-2"/> Generated Report</h4>
                 <div className="h-32 overflow-y-auto bg-slate-50 p-2 text-xs text-slate-600 rounded">
                   {selectedEmail.reportContent}
                 </div>
               </div>
               <div className="p-4 border border-slate-200 rounded-lg">
                 <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center"><Download size={16} className="mr-2"/> Original Attachments</h4>
                 <div className="space-y-2">
                   {selectedEmail.attachments.map((file, i) => (
                     <div key={i} className="flex items-center text-sm text-blue-600 underline cursor-pointer">
                       {file}
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
               <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
               {isUploading ? (
                 <div className="text-blue-500 animate-pulse font-medium">Scanning and uploading...</div>
               ) : scanFile ? (
                 <div className="flex flex-col items-center text-green-600">
                    <CheckCircle size={40} className="mb-2" />
                    <span className="font-medium">{scanFile} uploaded successfully</span>
                 </div>
               ) : (
                 <>
                   <Upload size={40} className="text-slate-400 mb-2" />
                   <span className="text-slate-600 font-medium">Drop scanned PDF here or click to upload</span>
                 </>
               )}
             </div>

             <div className="mt-auto pt-6 flex justify-end">
               <button 
                 disabled={!scanFile}
                 onClick={handleFinalize}
                 className={`px-8 py-3 rounded-lg font-bold flex items-center shadow-md transition-all ${
                   scanFile 
                   ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95' 
                   : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                 }`}
               >
                 <Mail size={18} className="mr-2" />
                 Email to Company & Archive
               </button>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Select an approved task to finalize</p>
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

export default AdminPortal;