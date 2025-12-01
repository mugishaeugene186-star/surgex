import React, { useState } from 'react';
import { User } from '../types';
import { X, Send, User as UserIcon, Mail } from 'lucide-react';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipient: string, note: string) => void;
  users: User[];
  currentUserId: string;
}

const ForwardModal: React.FC<ForwardModalProps> = ({ isOpen, onClose, onSend, users, currentUserId }) => {
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (recipient.trim()) {
      onSend(recipient, note);
      setRecipient('');
      setNote('');
      onClose();
    }
  };

  // Filter out current user from suggestions
  const availableUsers = users.filter(u => u.id !== currentUserId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Mail size={18} className="mr-2 text-blue-600" />
            Forward Email
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient</label>
            <div className="relative">
              <input 
                type="text" 
                list="user-suggestions"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Select user or type email address..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                autoFocus
              />
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <datalist id="user-suggestions">
              {availableUsers.map(user => (
                <option key={user.id} value={user.name}>{user.role}</option>
              ))}
            </datalist>
            <p className="text-xs text-slate-500 mt-1">Enter an email address for external recipients.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
            <textarea
               className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
               placeholder="Add a message..."
               value={note}
               onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button 
             onClick={handleSubmit}
             disabled={!recipient.trim()}
             className={`w-full py-2.5 rounded-lg font-medium mt-2 flex items-center justify-center transition-colors ${
                recipient.trim() 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
             }`}
          >
            <Send size={16} className="mr-2" />
            Forward
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;