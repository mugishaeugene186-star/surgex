import React, { useState } from 'react';
import { X, Bell, Calendar } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSet: (date: Date, note: string) => void;
  subject?: string;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSet, subject }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (date && time) {
      const scheduledDate = new Date(`${date}T${time}`);
      onSet(scheduledDate, note);
      // Reset and close
      setDate('');
      setTime('');
      setNote('');
      onClose();
    }
  };

  // Get current date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Bell size={18} className="mr-2 text-blue-600" />
            Set Follow-up Reminder
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-4">
          {subject && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 mb-2">
              <span className="font-semibold block text-xs uppercase tracking-wider text-blue-500 mb-1">Target Email</span>
              {subject}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  min={today}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <input 
                type="time" 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
            <textarea
               className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
               placeholder="e.g. Follow up on missing attachment..."
               value={note}
               onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg flex items-start space-x-2">
             <div className="mt-0.5 text-yellow-600"><Bell size={14}/></div>
             <p className="text-xs text-yellow-700">
               A notification will be sent to the assigned team member at the scheduled time. If unassigned, the notification will be sent to you.
             </p>
          </div>

          <button 
             onClick={handleSubmit}
             disabled={!date || !time}
             className={`w-full py-2.5 rounded-lg font-medium mt-2 flex items-center justify-center transition-colors ${
                date && time
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
             }`}
          >
            <Bell size={16} className="mr-2" />
            Schedule Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;