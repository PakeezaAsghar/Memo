export type PageId =
  | 'dashboard'
  | 'notes'
  | 'documents'
  | 'tasks'
  | 'bookmarks'
  | 'journal'
  | 'calendar'
  | 'finance'
  | 'study'
  | 'knowledge'
  | 'career'
  | 'projects'
  | 'habits'
  | 'reading'
  | 'media'
  | 'ideas'
  | 'gallery'
  | 'ai'
  | 'resources'
  | 'emergency'
  | 'settings'
  | 'help';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'sage' | 'rose' | 'lavender' | 'ochre';
  layoutDensity: 'comfortable' | 'compact';
  taskReminders: boolean;
  calendarReminders: boolean;
  dailySummaries: boolean;
  weeklyReports: boolean;
  twoFactorHint: boolean;
  aiAllowNotes: boolean;
  aiAllowDocuments: boolean;
  aiAllowTasks: boolean;
  aiAllowJournal: boolean;
  aiAllowStudy: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  emailVerified: boolean;
  preferences: UserPreferences;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  device: string;
  createdAt: string;
  lastActiveAt: string;
  current?: boolean;
}

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface NoteItem {
  id: string;
  title: string;
  contentHtml: string;
  plainText: string;
  category: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  wordCount: number;
  attachments: NoteAttachment[];
  updatedAt: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folder: string;
  url: string;
  extractedText?: string;
  shareToken?: string | null;
  isFavorite: boolean;
  isTrashed: boolean;
  uploadedAt: string;
}

export interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderTime?: string;
  subtasks: SubtaskItem[];
  order: number;
  createdAt: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  description: string;
  category: string;
  faviconUrl: string;
  isFavorite: boolean;
  createdAt: string;
}

export type JournalMood =
  | 'happy'
  | 'calm'
  | 'productive'
  | 'tired'
  | 'sad'
  | 'stressed';

export interface JournalEntry {
  id: string;
  title: string;
  contentHtml: string;
  plainText: string;
  mood: JournalMood;
  category: string;
  tags: string[];
  imageUrl?: string;
  isDraft: boolean;
  entryDate: string;
  createdAt: string;
}

export type CalendarMood = 'upset' | 'sad' | 'neutral' | 'good' | 'great';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: 'university' | 'meeting' | 'personal' | 'birthday' | 'reminder';
  description: string;
  location?: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date: string;
  recurring: boolean;
}

export interface BudgetLimit {
  id: string;
  category: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface StudySubject {
  id: string;
  name: string;
  code: string;
  semester: string;
  creditHours: number;
  progress: number;
  gradePoints: number;
  attendanceAttended: number;
  attendanceTotal: number;
  accent: 'sage' | 'lavender' | 'rose';
}

export interface StudySession {
  id: string;
  subjectId: string;
  durationMinutes: number;
  date: string;
  topic: string;
}

export interface StudyAssignment {
  id: string;
  subjectId: string;
  title: string;
  kind: 'assignment' | 'exam' | 'roadmap' | 'certificate';
  dueDate: string;
  completed: boolean;
  notes: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface FlashcardDeck {
  id: string;
  subjectId: string;
  title: string;
  cards: FlashcardItem[];
}

export interface TimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  time: string;
  subjectName: string;
  room: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  category:
    | 'Research'
    | 'Articles'
    | 'Lessons'
    | 'Concepts'
    | 'Quotes'
    | 'Vocabulary'
    | 'References';
  tags: string[];
  relatedIds: string[];
  attachmentName?: string;
  createdAt: string;
}

export interface CareerJob {
  id: string;
  company: string;
  role: string;
  kind: 'Job' | 'Internship';
  appliedDate: string;
  status: 'Interested' | 'Applied' | 'Interview' | 'Rejected' | 'Accepted';
  link: string;
  notes: string;
}

export interface CareerRecord {
  id: string;
  section:
    | 'resume'
    | 'certificate'
    | 'skill'
    | 'client'
    | 'freelance'
    | 'contact'
    | 'portfolio'
    | 'goal';
  title: string;
  subtitle: string;
  meta: string;
  amount?: number;
  link?: string;
  date: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  progress: number;
  startDate: string;
  deadline: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed';
  milestones: ProjectMilestone[];
  notes: string;
  links: { id: string; label: string; url: string }[];
  activity: { id: string; text: string; at: string }[];
}

export interface HabitItem {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  category: string;
  completedDates: string[];
}

export interface GoalItem {
  id: string;
  title: string;
  timeframe: 'Monthly' | 'Quarterly' | 'Yearly';
  progress: number;
  targetDate: string;
  milestones: { id: string; title: string; done: boolean }[];
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  category: 'Want to Read' | 'Currently Reading' | 'Completed' | 'On Hold';
  coverUrl?: string;
  currentPage: number;
  totalPages: number;
  rating: number;
  notes: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  mediaType: 'music' | 'movie';
  title: string;
  creator: string;
  genre: string;
  year?: string;
  status: 'Queue' | 'Current' | 'Completed';
  rating: number;
  url?: string;
  coverUrl?: string;
  isFavorite: boolean;
  notes: string;
  updatedAt: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'New' | 'Exploring' | 'In Progress' | 'Completed' | 'Archived';
  imageUrl?: string;
  referenceUrl?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category:
    | 'Memories'
    | 'Photography'
    | 'Design Inspiration'
    | 'Places'
    | 'Screenshots'
    | 'Personal Collections';
  album: string;
  imageUrl: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface SavedResource {
  id: string;
  title: string;
  url: string;
  category: 'Guide' | 'Template' | 'Toolkit' | 'Reference' | 'Inspiration';
  notes: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
}

export interface EmergencyInfo {
  id: string;
  bloodType: string;
  allergies: string;
  medicalNotes: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  homeAddress: string;
  emergencyPlan: string;
  contacts: EmergencyContact[];
  importantDocs: { id: string; label: string; value: string }[];
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  authorizedScopes?: string[];
  timestamp: string;
}

export interface AIChatThread {
  id: string;
  title: string;
  messages: AIMessage[];
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  targetPage: PageId;
}

export interface WorkspaceData {
  notes: NoteItem[];
  customNoteCategories: string[];
  documents: DocumentItem[];
  tasks: TaskItem[];
  bookmarks: BookmarkItem[];
  journal: JournalEntry[];
  events: CalendarEvent[];
  calendarMoods?: Record<string, CalendarMood>;
  transactions: FinanceTransaction[];
  budgets: BudgetLimit[];
  savingsGoals: SavingsGoal[];
  studySubjects: StudySubject[];
  studySessions: StudySession[];
  studyAssignments: StudyAssignment[];
  flashcardDecks: FlashcardDeck[];
  timetable: TimetableSlot[];
  knowledge: KnowledgeEntry[];
  careerJobs: CareerJob[];
  careerRecords: CareerRecord[];
  projects: ProjectItem[];
  habits: HabitItem[];
  goals: GoalItem[];
  books: BookItem[];
  media: MediaItem[];
  ideas: IdeaItem[];
  gallery: GalleryItem[];
  resources: SavedResource[];
  emergency: EmergencyInfo;
  aiThreads: AIChatThread[];
  notifications: NotificationItem[];
}

export type CollectionKey =
  | 'notes'
  | 'documents'
  | 'tasks'
  | 'bookmarks'
  | 'journal'
  | 'events'
  | 'transactions'
  | 'budgets'
  | 'savingsGoals'
  | 'studySubjects'
  | 'studySessions'
  | 'studyAssignments'
  | 'flashcardDecks'
  | 'timetable'
  | 'knowledge'
  | 'careerJobs'
  | 'careerRecords'
  | 'projects'
  | 'habits'
  | 'goals'
  | 'books'
  | 'media'
  | 'ideas'
  | 'gallery'
  | 'resources'
  | 'aiThreads'
  | 'notifications';
