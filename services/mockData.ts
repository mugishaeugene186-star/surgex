import { BankEmail, Category, EmailStatus, Priority, Role, User } from '../types';

export const CURRENT_USER_ID = 'worker-1';

export const USERS: User[] = [
  { id: 'boss-1', name: 'CEO MR HABERT', role: Role.BOSS, avatar: 'https://ui-avatars.com/api/?name=CEO+Mr+Habert&background=0D8ABC&color=fff' },
  { id: 'worker-1', name: 'John Field', role: Role.WORKER, status: 'Available', avatar: 'https://ui-avatars.com/api/?name=John+Field&background=random' },
  { id: 'worker-2', name: 'Sarah Site', role: Role.WORKER, status: 'Busy', avatar: 'https://ui-avatars.com/api/?name=Sarah+Site&background=random' },
  { id: 'super-1', name: 'Mike Manager', role: Role.SUPERVISOR, avatar: 'https://ui-avatars.com/api/?name=Mike+Manager&background=random' },
  { id: 'super-2', name: 'Steve Supervisor', role: Role.SUPERVISOR, avatar: 'https://ui-avatars.com/api/?name=Steve+Supervisor&background=random' },
  { id: 'admin-1', name: 'Magola', role: Role.ADMIN, avatar: 'https://ui-avatars.com/api/?name=Magola&background=random' }
];

export const INITIAL_EMAILS: BankEmail[] = [
  {
    id: 'email-1',
    sender: 'transactions@stanbic.co.ug',
    subject: 'Daily Transaction Report - Kampala Branch',
    body: 'Please review the attached transaction logs for the Kampala Road branch discrepancies. Several high-value UGX transfers require immediate validation.',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    bankName: 'Stanbic Bank',
    category: Category.ACCOUNT_STATEMENT,
    priority: Priority.HIGH,
    status: EmailStatus.ASSIGNED,
    assignedWorkerId: 'worker-1',
    attachments: ['trans_log_kla.pdf', 'summary_sheet.xlsx'],
    history: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 2.1), action: 'Email Detected', actor: 'System' },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 2), action: 'Auto-assigned to John Field', actor: 'System' }
    ]
  },
  {
    id: 'email-2',
    sender: 'fraud-alert@centenarybank.co.ug',
    subject: 'Urgent: Suspicious Activity Detected - Mbarara',
    body: 'Multiple failed login attempts from IP 197.239.x.x on Corporate Account #8832 (Mbarara Branch). Please investigate immediately.',
    receivedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    bankName: 'Centenary Bank',
    category: Category.TRANSACTION_ALERT,
    priority: Priority.URGENT,
    status: EmailStatus.DETECTED,
    attachments: ['security_audit_log.json'],
    history: [
      { date: new Date(Date.now() - 1000 * 60 * 30), action: 'Email Detected', actor: 'System' }
    ]
  },
  {
    id: 'email-3',
    sender: 'loans@dfcugroup.com',
    subject: 'Loan Application #4492 - Missing Requirements',
    body: 'The applicant has provided the URA tax returns but is missing the LC1 letter and proof of residence (Utility Bill). Please follow up.',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    bankName: 'dfcu Bank',
    category: Category.LOAN_CORRESPONDENCE,
    priority: Priority.MEDIUM,
    status: EmailStatus.PENDING_APPROVAL,
    assignedWorkerId: 'worker-1',
    reportContent: 'I have contacted the client. They will send the Umeme bill and LC1 letter by tomorrow.',
    attachments: ['ura_return_2023.pdf'],
    history: [
      { date: new Date(Date.now() - 1000 * 60 * 60 * 24), action: 'Email Detected', actor: 'System' },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 23), action: 'Auto-assigned to John Field', actor: 'System' },
      { date: new Date(Date.now() - 1000 * 60 * 60 * 4), action: 'Report Submitted', actor: 'John Field' }
    ]
  }
];

export const generateMockEmail = (index: number): BankEmail => {
  const banks = ['Stanbic Bank', 'Centenary Bank', 'Equity Bank', 'dfcu Bank', 'Absa Bank Uganda', 'Housing Finance Bank', 'DTB Uganda', 'KCB Bank'];
  const categories = Object.values(Category);
  const priorities = Object.values(Priority);
  
  const bank = banks[Math.floor(Math.random() * banks.length)];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  
  // Create a realistic Ugandan domain based on the bank name
  const domainMap: {[key: string]: string} = {
    'Stanbic Bank': 'stanbic.co.ug',
    'Centenary Bank': 'centenarybank.co.ug',
    'Equity Bank': 'equitybank.co.ug',
    'dfcu Bank': 'dfcugroup.com',
    'Absa Bank Uganda': 'absa.africa',
    'Housing Finance Bank': 'housingfinance.co.ug',
    'DTB Uganda': 'dtbafrica.com',
    'KCB Bank': 'kcbgroup.com'
  };

  const domain = domainMap[bank] || 'bank.co.ug';
  
  return {
    id: `mock-${index}-${Date.now()}`,
    sender: `notifications@${domain}`,
    subject: `${category} - Ref #${Math.floor(Math.random() * 10000) + 1000}`,
    body: `This is an automated notification regarding ${category} for account ending in ${Math.floor(Math.random() * 9000) + 1000}. Amount involved: UGX ${Math.floor(Math.random() * 10000000).toLocaleString()}. Please review the attached details and take necessary action.`,
    receivedAt: new Date(),
    bankName: bank,
    category: category,
    priority: priority,
    status: EmailStatus.DETECTED,
    attachments: ['statement.pdf'],
    history: []
  };
};