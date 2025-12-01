import React, { useState, useEffect, useRef } from 'react';
import { BankEmail, Role, User, EmailStatus, WorkflowEvent, AppNotification, Priority, Reminder, Category } from './types';
import { INITIAL_EMAILS, USERS, generateMockEmail } from './services/mockData';
import Layout from './components/Layout';
import BossDashboard from './components/BossDashboard';
import WorkerPortal from './components/WorkerPortal';
import SupervisorPortal from './components/SupervisorPortal';
import AdminPortal from './components/AdminPortal';

// Configuration
const WEBHOOK_URL = 'https://n8n.srv1102486.hstgr.cloud/webhook-test/bank-emals';
const POLL_INTERVAL = 10000; // 10 Seconds

function App() {
  // Initialize state with LocalStorage persistence for Users
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedUsers = localStorage.getItem('surgex_ug_v2_users');
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return USERS;
    } catch (error) {
      console.error('Failed to load users:', error);
      return USERS;
    }
  });

  // Initialize state with LocalStorage persistence for Emails
  const [emails, setEmails] = useState<BankEmail[]>(() => {
    try {
      const savedEmails = localStorage.getItem('surgex_ug_v2_emails');
      if (savedEmails) {
        const parsed = JSON.parse(savedEmails);
        return parsed.map((e: any) => ({
          ...e,
          receivedAt: new Date(e.receivedAt),
          history: e.history.map((h: any) => ({ ...h, date: new Date(h.date) }))
        }));
      }
    } catch (error) { console.error(error); }
    return INITIAL_EMAILS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('surgex_ug_v2_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => ({ ...r, dueAt: new Date(r.dueAt) }));
      }
    } catch (error) { console.error(error); }
    return [];
  });

  const [currentRole, setCurrentRole] = useState<Role>(Role.BOSS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const defaultUser = users.find(u => u.role === Role.BOSS) || users[0] || USERS[0];
    return defaultUser;
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Ref to track processed IDs to prevent duplicates during the session
  const processedIds = useRef<Set<string>>(new Set(emails.map(e => e.id)));

  // Persist State Changes
  useEffect(() => {
    if (users.length > 0) localStorage.setItem('surgex_ug_v2_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('surgex_ug_v2_emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem('surgex_ug_v2_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addNotification = (title: string, message: string, type: AppNotification['type'], targetRole?: Role, targetUserId?: string) => {
    const newNote: AppNotification = {
      id: Date.now().toString() + Math.random().toString(),
      title,
      message,
      timestamp: new Date(),
      read: false,
      type,
      targetRole,
      targetUserId
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  // --- CLASSIFICATION ENGINE ---
  const classifyEmail = (subject: string, body: string): { category: Category, priority: Priority } => {
    const text = (subject + ' ' + body).toLowerCase();
    
    let category = Category.GENERAL;
    let priority = Priority.MEDIUM;

    // Category Logic
    if (text.includes('loan') || text.includes('credit') || text.includes('mortgage') || text.includes('application')) {
      category = Category.LOAN_CORRESPONDENCE;
    } else if (text.includes('statement') || text.includes('balance') || text.includes('audit') || text.includes('reconciliation')) {
      category = Category.ACCOUNT_STATEMENT;
    } else if (text.includes('alert') || text.includes('fraud') || text.includes('suspicious') || text.includes('failed login') || text.includes('security')) {
      category = Category.TRANSACTION_ALERT;
    } else if (text.includes('payment') || text.includes('transfer') || text.includes('remittance') || text.includes('swift')) {
      category = Category.PAYMENT_NOTIFICATION;
    }

    // Priority Logic
    if (text.includes('urgent') || text.includes('immediate') || text.includes('fraud') || text.includes('unauthorized') || text.includes('critical')) {
      priority = Priority.URGENT;
    } else if (text.includes('review') || text.includes('verify') || text.includes('action required')) {
      priority = Priority.HIGH;
    }

    // High Value Logic (UGX heuristics)
    if (text.includes('million') || text.includes('billion') || text.match(/[\d,]+\s?000\s?000/)) {
      // If it involves millions/billions and isn't already urgent
      if (priority !== Priority.URGENT) priority = Priority.HIGH;
    }

    return { category, priority };
  };

  // --- WEBHOOK MONITORING SERVICE ---
  useEffect(() => {
    const fetchEmailsFromWebhook = async () => {
      try {
        // Fetch from n8n webhook
        const response = await fetch(WEBHOOK_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) return;

        const data = await response.json();
        const incomingList = Array.isArray(data) ? data : [data];

        let newEmailsCount = 0;

        // Process each email found
        incomingList.forEach((rawItem: any) => {
          // Normalize Data
          const id = rawItem.id || rawItem.messageId || `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Deduplication check
          if (processedIds.current.has(id)) return;
          
          const subject = rawItem.subject || rawItem.title || 'No Subject';
          const body = rawItem.body || rawItem.text || rawItem.content || '';
          const sender = rawItem.sender || rawItem.from || 'webhook@external.source';
          const bankName = rawItem.bankName || rawItem.bank || 'External Bank';
          
          // Filter: Ensure it has minimal content
          if (!subject && !body) return;

          // 1. CLASSIFY & LABEL
          const { category, priority } = classifyEmail(subject, body);

          // 2. IDENTIFY WORKER & ALLOCATE
          // Logic: Find first available field worker in the CURRENT users list
          const availableWorker = users.find(u => u.role === Role.WORKER && u.status === 'Available');
          
          let status = EmailStatus.DETECTED;
          let assignedWorkerId = undefined;
          const history: WorkflowEvent[] = [{ date: new Date(), action: 'Imported from Webhook', actor: 'System' }];

          if (availableWorker) {
            status = EmailStatus.ASSIGNED;
            assignedWorkerId = availableWorker.id;
            history.push({
              date: new Date(),
              action: `Auto-allocated to ${availableWorker.name}`,
              actor: 'Auto-Dispatcher'
            });

            addNotification(
              'Webhook Assignment',
              `Incoming: ${subject.substring(0, 30)}...`,
              priority === Priority.URGENT ? 'alert' : 'info',
              undefined,
              availableWorker.id
            );
          } else {
             history.push({ date: new Date(), action: 'Queued - No Agents Available', actor: 'System' });
             addNotification(
               'Unassigned Webhook Email',
               `Action required: ${bankName}`,
               'warning',
               Role.BOSS
             );
          }

          const newEmail: BankEmail = {
            id,
            sender,
            subject,
            body: body || 'No content provided.',
            receivedAt: new Date(),
            bankName,
            category,
            priority,
            status,
            assignedWorkerId,
            attachments: [],
            history
          };

          // Update State
          setEmails(prev => [newEmail, ...prev]);
          processedIds.current.add(id);
          newEmailsCount++;
        });

        if (newEmailsCount > 0) {
           // Optional: Generic notification for Boss if bulk import happens
           if (newEmailsCount > 1) {
             addNotification('System Sync', `${newEmailsCount} new emails imported from Webhook`, 'success', Role.BOSS);
           }
        }

      } catch (error) {
        // Silent fail for polling errors
      }
    };

    // Initial fetch
    fetchEmailsFromWebhook();

    // Poll interval
    const intervalId = setInterval(fetchEmailsFromWebhook, POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [users]); // Only re-bind if users change (to ensure correct allocation)

  // --- MOCK SIMULATION (FALLBACK) ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Low probability mock generation to avoid cluttering if webhook is active
      if (Math.random() > 0.8) return; 

      const rawEmail = generateMockEmail(emails.length + 1);
      const { category, priority } = classifyEmail(rawEmail.subject, rawEmail.body);
      
      const newEmail: BankEmail = {
        ...rawEmail,
        id: `mock-${Date.now()}`,
        receivedAt: new Date(),
        status: EmailStatus.DETECTED,
        assignedWorkerId: undefined,
        category, 
        priority,
        history: [{ date: new Date(), action: 'Email Detected', actor: 'System' }]
      };

      const availableWorker = users.find(u => u.role === Role.WORKER && u.status === 'Available');
      
      if (availableWorker) {
         newEmail.status = EmailStatus.ASSIGNED;
         newEmail.assignedWorkerId = availableWorker.id;
         newEmail.history.push({
           date: new Date(),
           action: `Auto-assigned to ${availableWorker.name}`,
           actor: 'System'
         });
         addNotification('New Task Assigned', `Assigned: ${newEmail.subject}`, 'info', undefined, availableWorker.id);
      }

      setEmails(prev => [newEmail, ...prev]);
    }, 30000); // Very slow mock generation

    return () => clearInterval(interval);
  }, [emails.length, users]);

  // --- REMINDER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setReminders(prevReminders => {
         let hasUpdates = false;
         const updatedReminders = prevReminders.map(r => {
            if (!r.processed && new Date(r.dueAt) <= now) {
               hasUpdates = true;
               const relatedEmail = emails.find(e => e.id === r.emailId);
               const title = `Reminder: ${relatedEmail ? relatedEmail.subject.substring(0, 20) + '...' : 'Follow-up'}`;
               addNotification(title, r.message || "Scheduled follow-up reminder.", 'warning', undefined, r.targetUserId);
               return { ...r, processed: true };
            }
            return r;
         });
         return hasUpdates ? updatedReminders : prevReminders;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [emails]);

  const handleRoleSwitch = (role: Role) => {
    setCurrentRole(role);
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
    } else {
      if (role !== Role.BOSS) {
         // Fallback if the default user for that role was deleted
         addNotification('Access Warning', `No user found for role: ${role}. Switched to Boss view.`, 'alert', Role.BOSS);
         setCurrentRole(Role.BOSS);
         const boss = users.find(u => u.role === Role.BOSS);
         if (boss) setCurrentUser(boss);
      }
    }
  };

  const handleStatusChange = (status: 'Available' | 'Busy' | 'Offline') => {
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, status } : u);
    setUsers(updatedUsers);
    const updatedUser = updatedUsers.find(u => u.id === currentUser.id);
    if (updatedUser) setCurrentUser(updatedUser);
  };

  const handleAddUser = (name: string, role: Role) => {
    const newUser: User = {
      id: `${role.toLowerCase()}-${Date.now()}`,
      name,
      role,
      avatar: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
      status: role === Role.WORKER ? 'Available' : undefined
    };
    setUsers(prev => [...prev, newUser]);
    addNotification('Team Update', `${name} added to team.`, 'success', Role.BOSS);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
       addNotification('Operation Failed', 'You cannot delete your own account.', 'alert', Role.BOSS);
       return;
    }
    // Unassign tasks logic: Important so emails don't get stuck on deleted users
    setEmails(prev => prev.map(e => {
        if (e.assignedWorkerId === userId) {
            return {
                ...e,
                assignedWorkerId: undefined,
                status: EmailStatus.DETECTED,
                history: [...e.history, { date: new Date(), action: `Unassigned (User deleted)`, actor: 'System' }]
            };
        }
        return e;
    }));
    setUsers(prev => prev.filter(u => u.id !== userId));
    addNotification('Team Update', 'User removed and tasks unassigned.', 'info', Role.BOSS);
  };

  const handleUpdateEmail = (id: string, updates: Partial<BankEmail>) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;

    setEmails(prev => prev.map(e => {
      if (e.id === id) {
        let action = 'Updated';
        if (updates.status === EmailStatus.PENDING_APPROVAL) {
          action = 'Report Submitted';
          addNotification('Approval Request', `Report pending: ${e.subject}`, 'warning', Role.SUPERVISOR);
        }
        if (updates.status === EmailStatus.APPROVED) {
          action = 'Approved by Supervisor';
          addNotification('Document Ready', `Approved: ${e.subject}`, 'success', Role.ADMIN);
          if (e.assignedWorkerId) addNotification('Report Approved', `Your report was approved.`, 'success', undefined, e.assignedWorkerId);
        }
        if (updates.status === EmailStatus.REJECTED) {
          action = 'Rejected by Supervisor';
          if (e.assignedWorkerId) addNotification('Action Required', `Report rejected. See comments.`, 'alert', undefined, e.assignedWorkerId);
        }
        if (updates.status === EmailStatus.COMPLETED) {
          action = 'Document Archived';
          addNotification('Workflow Completed', `${e.subject} archived.`, 'success', Role.BOSS);
        }
        if (updates.assignedWorkerId && updates.assignedWorkerId !== e.assignedWorkerId) {
          action = 'Reassigned';
          addNotification('Task Reassigned', `Assigned: ${e.subject}`, 'info', undefined, updates.assignedWorkerId);
        }

        return { 
          ...e, 
          ...updates,
          history: [...e.history, { date: new Date(), action, actor: currentUser.name }]
        };
      }
      return e;
    }));
  };

  const handleForwardEmail = (emailId: string, recipientNameOrEmail: string, note: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    const targetUser = users.find(u => u.name === recipientNameOrEmail);
    let actionDescription = targetUser ? `Forwarded to ${targetUser.name}` : `Forwarded to external: ${recipientNameOrEmail}`;
    
    if (targetUser) {
        addNotification(`Fwd: ${email.subject}`, `Forwarded by ${currentUser.name}. Note: ${note}`, 'info', undefined, targetUser.id);
    }

    setEmails(prev => prev.map(e => {
        if (e.id === emailId) {
            return {
                ...e,
                history: [...e.history, { date: new Date(), action: actionDescription, actor: currentUser.name }]
            }
        }
        return e;
    }));
    addNotification('Email Forwarded', `Sent to ${targetUser ? targetUser.name : recipientNameOrEmail}`, 'success', currentUser.role);
  };

  const handleSetReminder = (emailId: string, date: Date, note: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    const targetId = email.assignedWorkerId || currentUser.id;
    
    setReminders(prev => [...prev, {
      id: Date.now().toString(),
      emailId,
      targetUserId: targetId,
      message: note,
      dueAt: date,
      processed: false,
      createdBy: currentUser.id
    }]);
    
    setEmails(prev => prev.map(e => e.id === emailId ? { 
      ...e, 
      history: [...e.history, { date: new Date(), action: `Reminder set`, actor: currentUser.name }] 
    } : e));

    addNotification('Reminder Scheduled', `Set for ${date.toLocaleString()}`, 'success', Role.BOSS);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications(prev => prev.map(n => {
       if (n.targetRole === currentUser.role || n.targetUserId === currentUser.id) return { ...n, read: true };
       return n;
    }));
  };

  const currentNotifications = notifications.filter(n => 
    (n.targetRole === currentUser.role) || (n.targetUserId === currentUser.id)
  );

  return (
    <Layout 
      currentUser={currentUser} 
      onRoleSwitch={handleRoleSwitch}
      onStatusChange={handleStatusChange}
      notifications={currentNotifications}
      onMarkAsRead={handleMarkAsRead}
      onClearAll={handleClearNotifications}
      allEmails={emails}
      allUsers={users}
    >
      {currentRole === Role.BOSS && (
        <BossDashboard 
          emails={emails} 
          users={users} 
          currentUser={currentUser}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
          onForward={handleForwardEmail}
          onSetReminder={handleSetReminder}
        />
      )}
      {currentRole === Role.WORKER && (
        <WorkerPortal 
          emails={emails} 
          currentUserId={currentUser.id} 
          users={users}
          onUpdateEmail={handleUpdateEmail}
          onForward={handleForwardEmail}
        />
      )}
      {currentRole === Role.SUPERVISOR && (
        <SupervisorPortal 
          emails={emails}
          workers={users}
          currentUser={currentUser}
          onUpdateEmail={handleUpdateEmail}
          onForward={handleForwardEmail}
        />
      )}
      {currentRole === Role.ADMIN && (
        <AdminPortal 
          emails={emails}
          users={users}
          currentUserId={currentUser.id}
          onUpdateEmail={handleUpdateEmail}
          onForward={handleForwardEmail}
        />
      )}
    </Layout>
  );
}

export default App;