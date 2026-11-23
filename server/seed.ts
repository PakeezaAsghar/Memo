import fs from 'node:fs';
import path from 'node:path';
import type { MediaItem, UserPreferences, WorkspaceData } from '../src/types/workspace.ts';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  accentColor: 'sage',
  layoutDensity: 'comfortable',
  taskReminders: true,
  calendarReminders: true,
  dailySummaries: true,
  weeklyReports: false,
  twoFactorHint: true,
  aiAllowNotes: true,
  aiAllowDocuments: true,
  aiAllowTasks: true,
  aiAllowJournal: false,
  aiAllowStudy: true,
};

function createSamplePdfBuffer(title: string, lines: string[]): Buffer {
  const escapePdf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const textOps = [
    'BT',
    '/F1 16 Tf',
    '54 740 Td',
    `(${escapePdf(title)}) Tj`,
    '/F1 11 Tf',
    '0 -26 Td',
    ...lines.flatMap((line) => [`(${escapePdf(line)}) Tj`, '0 -18 Td']),
    'ET',
  ].join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  );
  objects.push(
    `4 0 obj\n<< /Length ${Buffer.byteLength(textOps, 'utf8')} >>\nstream\n${textOps}\nendstream\nendobj\n`
  );
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

export function ensureSeedFilesForUser(userId: string, uploadsRoot: string) {
  const userDir = path.join(uploadsRoot, userId);
  fs.mkdirSync(userDir, { recursive: true });

  const syllabusPath = path.join(userDir, 'HCI_Research_Methods_Syllabus.pdf');
  if (!fs.existsSync(syllabusPath)) {
    const pdfBuf = createSamplePdfBuffer('HCI Research Methods - Fall 2026 Syllabus', [
      'Course Code: CS-418 | Instructor: Dr. Elena Vance | Credits: 4',
      'Schedule: Tuesdays & Thursdays 10:30 AM - 12:00 PM (Studio Hall 204)',
      'Week 1-4: Contextual Inquiry, Affinity Diagramming, Field Observation',
      'Week 5-8: Cognitive Walkthroughs, Heuristic Evaluation & Prototyping',
      'Week 9-12: Quantitative Usability Metrics, Mixed Methods Synthesis',
      'Final Capstone Deliverable: Field Study Paper & Interactive Prototype (Nov 28)',
    ]);
    fs.writeFileSync(syllabusPath, pdfBuf);
  }

  const budgetCsvPath = path.join(userDir, 'Semester_Budget_Worksheet.csv');
  if (!fs.existsSync(budgetCsvPath)) {
    fs.writeFileSync(
      budgetCsvPath,
      'Category,Monthly Limit,November Spent,Notes\nFood,380,248.50,Groceries and cafe study sessions\nTransport,120,64.00,Transit pass and bike maintenance\nEducation,250,142.00,Reference books and print bindings\nShopping,180,94.00,Desk lamp and linen notebooks\nBills,520,495.00,Rent share and fiber internet\n',
      'utf8'
    );
  }

  const resumePath = path.join(userDir, 'Claire_Lin_Product_Design_CV.pdf');
  if (!fs.existsSync(resumePath)) {
    const pdfBuf = createSamplePdfBuffer('Claire Lin - Product Designer & Researcher', [
      'Education: B.S. Human-Computer Interaction & Visual Communication (GPA 3.84)',
      'Experience: Design Intern at Atelier Nord (Summer 2026) - Design Systems & Prototyping',
      'Skills: Figma, React, TypeScript, Design Systems, Qualitative User Research',
      'Portfolio: Editorial productivity workflows, accessibility-first web tools',
    ]);
    fs.writeFileSync(resumePath, pdfBuf);
  }
}

export function createSeedWorkspace(userId: string, uploadsRoot: string): WorkspaceData {
  ensureSeedFilesForUser(userId, uploadsRoot);

  const today = new Date();
  const fmt = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  const todayStr = fmt(0);
  const yesterdayStr = fmt(-1);
  const twoDaysAgoStr = fmt(-2);
  const threeDaysAgoStr = fmt(-3);
  const tomorrowStr = fmt(1);
  const inThreeDaysStr = fmt(3);
  const inFiveDaysStr = fmt(5);
  const inNineDaysStr = fmt(9);

  return {
    notes: [
      {
        id: 'note-1',
        title: 'Editorial UI Principles for Calm Software',
        contentHtml:
          '<h2>Core Observations</h2><p>Calm interfaces respect attention by pairing generous cream margins with crisp typographic hierarchy. Avoid unnecessary visual noise.</p><ul><li>Use <mark>consistent semantic accents</mark> rather than decorative rainbows.</li><li>Give long-form writing comfortable line length (65ch).</li><li>Keep primary actions predictable and grounded.</li></ul>',
        plainText:
          'Core Observations Calm interfaces respect attention by pairing generous cream margins with crisp typographic hierarchy. Avoid unnecessary visual noise. Use consistent semantic accents rather than decorative rainbows. Give long-form writing comfortable line length (65ch). Keep primary actions predictable and grounded.',
        category: 'Ideas',
        isPinned: true,
        isFavorite: true,
        isArchived: false,
        wordCount: 44,
        attachments: [],
        updatedAt: `${todayStr}T09:15:00.000Z`,
        createdAt: `${threeDaysAgoStr}T14:20:00.000Z`,
      },
      {
        id: 'note-2',
        title: 'CS-418 Field Observation Synthesis',
        contentHtml:
          '<p>Interviewed 6 graduate students about how they organize reading PDFs and lecture notes across semesters.</p><ul><li><strong>Pain point:</strong> Files scattered between downloads folder and cloud tabs.</li><li><strong>Workaround:</strong> Creating manual index docs before finals week.</li><li><strong>Opportunity:</strong> Backlinks between concepts and primary PDFs.</li></ul>',
        plainText:
          'Interviewed 6 graduate students about how they organize reading PDFs and lecture notes across semesters. Pain point: Files scattered between downloads folder and cloud tabs. Workaround: Creating manual index docs before finals week. Opportunity: Backlinks between concepts and primary PDFs.',
        category: 'Study',
        isPinned: false,
        isFavorite: true,
        isArchived: false,
        wordCount: 43,
        attachments: [],
        updatedAt: `${yesterdayStr}T17:40:00.000Z`,
        createdAt: `${twoDaysAgoStr}T11:00:00.000Z`,
      },
      {
        id: 'note-3',
        title: 'Sunday Pantry & Studio Reset Checklist',
        contentHtml:
          '<p>Small weekly rituals that make Monday mornings feel effortless:</p><ul><li>Fresh chamomile and roasted barley tea restock</li><li>Clear desk tray and sharpen cedar pencils</li><li>Review upcoming week calendar blocks</li></ul>',
        plainText:
          'Small weekly rituals that make Monday mornings feel effortless: Fresh chamomile and roasted barley tea restock, Clear desk tray and sharpen cedar pencils, Review upcoming week calendar blocks',
        category: 'Personal',
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        wordCount: 28,
        attachments: [],
        updatedAt: `${twoDaysAgoStr}T20:10:00.000Z`,
        createdAt: `${twoDaysAgoStr}T20:10:00.000Z`,
      },
      {
        id: 'note-4',
        title: 'Portfolio Case Study Narrative Outline',
        contentHtml:
          '<h2>1. Problem Framing</h2><p>Show the before-and-after information architecture clearly. Highlight typography decisions and research findings with real quotes.</p>',
        plainText:
          '1. Problem Framing Show the before-and-after information architecture clearly. Highlight typography decisions and research findings with real quotes.',
        category: 'Projects',
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        wordCount: 21,
        attachments: [],
        updatedAt: `${threeDaysAgoStr}T10:30:00.000Z`,
        createdAt: `${threeDaysAgoStr}T10:30:00.000Z`,
      },
    ],
    customNoteCategories: ['Reading Notes', 'Recipes'],
    documents: [
      {
        id: 'doc-1',
        name: 'HCI_Research_Methods_Syllabus.pdf',
        mimeType: 'application/pdf',
        size: 18420,
        folder: 'Study Material',
        url: `/api/files/${userId}/HCI_Research_Methods_Syllabus.pdf`,
        extractedText:
          'Course Code: CS-418. Instructor: Dr. Elena Vance. Credits: 4. Final Capstone Deliverable: Field Study Paper & Interactive Prototype (Nov 28).',
        shareToken: null,
        isFavorite: true,
        isTrashed: false,
        uploadedAt: `${yesterdayStr}T12:15:00.000Z`,
      },
      {
        id: 'doc-2',
        name: 'Semester_Budget_Worksheet.csv',
        mimeType: 'text/csv',
        size: 1420,
        folder: 'Personal',
        url: `/api/files/${userId}/Semester_Budget_Worksheet.csv`,
        extractedText:
          'Food limit 380 spent 248.50. Transport limit 120 spent 64.00. Education limit 250 spent 142.00.',
        shareToken: null,
        isFavorite: false,
        isTrashed: false,
        uploadedAt: `${twoDaysAgoStr}T16:45:00.000Z`,
      },
      {
        id: 'doc-3',
        name: 'Claire_Lin_Product_Design_CV.pdf',
        mimeType: 'application/pdf',
        size: 15840,
        folder: 'Work',
        url: `/api/files/${userId}/Claire_Lin_Product_Design_CV.pdf`,
        extractedText:
          'Claire Lin - Product Designer & Researcher. B.S. HCI & Visual Communication. Design Intern at Atelier Nord.',
        shareToken: null,
        isFavorite: true,
        isTrashed: false,
        uploadedAt: `${threeDaysAgoStr}T09:00:00.000Z`,
      },
      {
        id: 'doc-4',
        name: 'Pressed_Botanical_Reference.jpg',
        mimeType: 'image/jpeg',
        size: 248000,
        folder: 'Images',
        url: '/src/assets/images/journal_botanical_1795116543773.jpg',
        shareToken: null,
        isFavorite: false,
        isTrashed: false,
        uploadedAt: `${threeDaysAgoStr}T18:20:00.000Z`,
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Finalize CS-418 affinity diagram slides',
        description: 'Cluster interview observations into 4 behavioral themes for Thursday critique.',
        category: 'Study',
        priority: 'high',
        dueDate: todayStr,
        completed: false,
        recurring: 'none',
        reminderTime: '16:00',
        subtasks: [
          { id: 'st-1', title: 'Export interview quotes', done: true },
          { id: 'st-2', title: 'Create 4 theme summary cards', done: false },
        ],
        order: 0,
        createdAt: `${yesterdayStr}T08:30:00.000Z`,
      },
      {
        id: 'task-2',
        title: 'Submit studio internship portfolio link',
        description: 'Double-check responsive preview on mobile before sending email to Studio Kinfolk.',
        category: 'Career',
        priority: 'high',
        dueDate: tomorrowStr,
        completed: false,
        recurring: 'none',
        reminderTime: '11:00',
        subtasks: [],
        order: 1,
        createdAt: `${yesterdayStr}T09:15:00.000Z`,
      },
      {
        id: 'task-3',
        title: 'Evening 25-minute reading block',
        description: 'Finish chapter 4 of The Architecture of Happiness with margin notes.',
        category: 'Personal',
        priority: 'medium',
        dueDate: todayStr,
        completed: true,
        recurring: 'daily',
        subtasks: [],
        order: 2,
        createdAt: `${twoDaysAgoStr}T19:00:00.000Z`,
      },
      {
        id: 'task-4',
        title: 'Reconcile November grocery & cafe receipts',
        description: 'Log remaining receipts into Finance ledger before Sunday review.',
        category: 'Finance',
        priority: 'low',
        dueDate: inThreeDaysStr,
        completed: false,
        recurring: 'weekly',
        subtasks: [],
        order: 3,
        createdAt: `${twoDaysAgoStr}T11:20:00.000Z`,
      },
    ],
    bookmarks: [
      {
        id: 'bm-1',
        title: 'Typewolf — Typography Inspiration & Font Pairings',
        url: 'https://www.typewolf.com',
        domain: 'typewolf.com',
        description: 'Curated editorial font pairings and real-world serif/sans combinations.',
        category: 'Design',
        faviconUrl: 'https://www.google.com/s2/favicons?domain=typewolf.com&sz=64',
        isFavorite: true,
        createdAt: `${threeDaysAgoStr}T10:00:00.000Z`,
      },
      {
        id: 'bm-2',
        title: 'MDN Web Docs — CSS Grid & Subgrid Guide',
        url: 'https://developer.mozilla.org',
        domain: 'developer.mozilla.org',
        description: 'Reference documentation for modern responsive layout patterns.',
        category: 'Development',
        faviconUrl: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64',
        isFavorite: false,
        createdAt: `${twoDaysAgoStr}T15:10:00.000Z`,
      },
      {
        id: 'bm-3',
        title: 'Nielsen Norman Group — Usability Heuristics',
        url: 'https://www.nngroup.com',
        domain: 'nngroup.com',
        description: 'Essential UX research methodology articles for CS-418 coursework.',
        category: 'Research',
        faviconUrl: 'https://www.google.com/s2/favicons?domain=nngroup.com&sz=64',
        isFavorite: true,
        createdAt: `${yesterdayStr}T13:30:00.000Z`,
      },
      {
        id: 'bm-4',
        title: 'Are.na — Calm Visual Collections',
        url: 'https://www.are.na',
        domain: 'are.na',
        description: 'Minimalist research channels for editorial interfaces and print design.',
        category: 'Learning',
        faviconUrl: 'https://www.google.com/s2/favicons?domain=are.na&sz=64',
        isFavorite: false,
        createdAt: `${todayStr}T08:00:00.000Z`,
      },
    ],
    journal: [
      {
        id: 'jr-1',
        title: 'Slow Rain, Warm Tea, and Quiet Focus',
        contentHtml:
          '<p>Spent the morning by the window organizing my autumn study plan. Turning off notifications for three hours completely changed how calmly I moved through my reading list.</p><p>Small reminder to myself: pace matters more than urgency.</p>',
        plainText:
          'Spent the morning by the window organizing my autumn study plan. Turning off notifications for three hours completely changed how calmly I moved through my reading list. Small reminder to myself: pace matters more than urgency.',
        mood: 'calm',
        category: 'Reflection',
        tags: ['mindfulness', 'autumn', 'routine'],
        imageUrl: '/src/assets/images/journal_botanical_1795116543773.jpg',
        isDraft: false,
        entryDate: todayStr,
        createdAt: `${todayStr}T08:45:00.000Z`,
      },
      {
        id: 'jr-2',
        title: 'Critique Session Breakthrough',
        contentHtml:
          '<p>Presented the early typography wireframes to our studio group today. Simplifying the sidebar from 3 nested levels to clean flat categories made everything breathe immediately.</p>',
        plainText:
          'Presented the early typography wireframes to our studio group today. Simplifying the sidebar from 3 nested levels to clean flat categories made everything breathe immediately.',
        mood: 'productive',
        category: 'Creative',
        tags: ['design', 'university'],
        isDraft: false,
        entryDate: yesterdayStr,
        createdAt: `${yesterdayStr}T21:10:00.000Z`,
      },
      {
        id: 'jr-3',
        title: 'Evening Gratitude Notes',
        contentHtml:
          '<p>Grateful for warm roasted chestnut soup, a long walk through the park before dusk, and finishing my lab notes ahead of schedule.</p>',
        plainText:
          'Grateful for warm roasted chestnut soup, a long walk through the park before dusk, and finishing my lab notes ahead of schedule.',
        mood: 'happy',
        category: 'Gratitude',
        tags: ['gratitude', 'evening'],
        isDraft: false,
        entryDate: twoDaysAgoStr,
        createdAt: `${twoDaysAgoStr}T22:00:00.000Z`,
      },
    ],
    events: [
      {
        id: 'ev-1',
        title: 'CS-418 Studio Critique',
        date: todayStr,
        startTime: '14:00',
        endTime: '15:30',
        category: 'university',
        description: 'Present affinity synthesis slides and usability findings.',
        location: 'Studio Hall 204',
      },
      {
        id: 'ev-2',
        title: 'Coffee & Portfolio Review with Maya',
        date: tomorrowStr,
        startTime: '10:30',
        endTime: '11:30',
        category: 'meeting',
        description: 'Review internship application deck and case study pacing.',
        location: 'Linden Roasters',
      },
      {
        id: 'ev-3',
        title: 'Hannah’s Birthday Dinner',
        date: inThreeDaysStr,
        startTime: '19:00',
        endTime: '21:30',
        category: 'birthday',
        description: 'Bring wrapped linen journal and handwritten card.',
        location: 'Osteria Verde',
      },
      {
        id: 'ev-4',
        title: 'Renew University Library Books',
        date: inFiveDaysStr,
        startTime: '09:00',
        endTime: '09:30',
        category: 'reminder',
        description: 'Extend borrowing window for Interaction Design texts.',
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        type: 'income',
        amount: 1650,
        category: 'Freelance',
        description: 'Brand & editorial layout retainer — Atelier Nord',
        date: `${todayStr.slice(0, 7)}-01`,
        recurring: true,
      },
      {
        id: 'tx-2',
        type: 'income',
        amount: 620,
        category: 'Salary',
        description: 'University Design Lab Assistantship',
        date: `${todayStr.slice(0, 7)}-05`,
        recurring: true,
      },
      {
        id: 'tx-3',
        type: 'expense',
        amount: 495,
        category: 'Bills',
        description: 'Apartment share & utilities',
        date: `${todayStr.slice(0, 7)}-02`,
        recurring: true,
      },
      {
        id: 'tx-4',
        type: 'expense',
        amount: 118.4,
        category: 'Food',
        description: 'Weekly farmers market & pantry groceries',
        date: threeDaysAgoStr,
        recurring: false,
      },
      {
        id: 'tx-5',
        type: 'expense',
        amount: 64,
        category: 'Transport',
        description: 'Monthly metro pass',
        date: `${todayStr.slice(0, 7)}-03`,
        recurring: true,
      },
      {
        id: 'tx-6',
        type: 'expense',
        amount: 86,
        category: 'Education',
        description: 'Grid Systems & Typography reference book',
        date: twoDaysAgoStr,
        recurring: false,
      },
      {
        id: 'tx-7',
        type: 'expense',
        amount: 34.5,
        category: 'Food',
        description: 'Matcha latte & study pastries',
        date: yesterdayStr,
        recurring: false,
      },
      {
        id: 'tx-8',
        type: 'expense',
        amount: 52,
        category: 'Shopping',
        description: 'Brass pen & fountain ink bottle',
        date: todayStr,
        recurring: false,
      },
    ],
    budgets: [
      { id: 'bg-1', category: 'Food', limit: 350 },
      { id: 'bg-2', category: 'Transport', limit: 120 },
      { id: 'bg-3', category: 'Education', limit: 200 },
      { id: 'bg-4', category: 'Shopping', limit: 150 },
      { id: 'bg-5', category: 'Bills', limit: 550 },
      { id: 'bg-6', category: 'Entertainment', limit: 100 },
    ],
    savingsGoals: [
      {
        id: 'sg-1',
        title: 'Spring Kyoto Study Trip',
        targetAmount: 2400,
        currentAmount: 1680,
        targetDate: '2027-04-01',
      },
      {
        id: 'sg-2',
        title: 'Emergency Studio Cushion',
        targetAmount: 3000,
        currentAmount: 2250,
        targetDate: '2027-06-01',
      },
    ],
    studySubjects: [
      {
        id: 'sub-1',
        name: 'HCI Research Methods',
        code: 'CS-418',
        semester: 'Fall 2026',
        creditHours: 4,
        progress: 76,
        gradePoints: 3.9,
        attendanceAttended: 21,
        attendanceTotal: 22,
        accent: 'sage',
      },
      {
        id: 'sub-2',
        name: 'Editorial & Information Design',
        code: 'DES-312',
        semester: 'Fall 2026',
        creditHours: 3,
        progress: 82,
        gradePoints: 4.0,
        attendanceAttended: 18,
        attendanceTotal: 19,
        accent: 'lavender',
      },
      {
        id: 'sub-3',
        name: 'Front-End Systems Architecture',
        code: 'CS-340',
        semester: 'Fall 2026',
        creditHours: 4,
        progress: 64,
        gradePoints: 3.7,
        attendanceAttended: 19,
        attendanceTotal: 21,
        accent: 'rose',
      },
    ],
    studySessions: [
      { id: 'ss-1', subjectId: 'sub-1', durationMinutes: 90, date: todayStr, topic: 'Affinity diagram synthesis' },
      { id: 'ss-2', subjectId: 'sub-2', durationMinutes: 75, date: yesterdayStr, topic: 'Grid modularity & baseline rhythm' },
      { id: 'ss-3', subjectId: 'sub-3', durationMinutes: 110, date: twoDaysAgoStr, topic: 'Accessible state management patterns' },
    ],
    studyAssignments: [
      {
        id: 'sa-1',
        subjectId: 'sub-1',
        title: 'Field Study Synthesis Report',
        kind: 'assignment',
        dueDate: inFiveDaysStr,
        completed: false,
        notes: 'Include 6 participant profiles and coded themes.',
      },
      {
        id: 'sa-2',
        subjectId: 'sub-3',
        title: 'Systems Architecture Midterm Exam',
        kind: 'exam',
        dueDate: inNineDaysStr,
        completed: false,
        notes: 'Review rendering lifecycle & state normalization.',
      },
      {
        id: 'sa-3',
        subjectId: 'sub-2',
        title: 'Google UX Foundations Certificate',
        kind: 'certificate',
        dueDate: yesterdayStr,
        completed: true,
        notes: 'Completed with 98% capstone score.',
      },
    ],
    flashcardDecks: [
      {
        id: 'fc-1',
        subjectId: 'sub-1',
        title: 'Usability Heuristics & Research Terms',
        cards: [
          {
            id: 'card-1',
            front: 'What is Contextual Inquiry?',
            back: 'An ethnographic field interview method observing users in their natural work environment while asking clarifying questions.',
            mastered: true,
          },
          {
            id: 'card-2',
            front: 'Explain Recognition Rather Than Recall.',
            back: 'Minimize user memory load by making objects, actions, and options visible and easily retrievable.',
            mastered: false,
          },
          {
            id: 'card-3',
            front: 'What is a Cognitive Walkthrough?',
            back: 'A usability inspection method evaluating learnability by stepping through tasks as a first-time user.',
            mastered: false,
          },
        ],
      },
    ],
    timetable: [
      { id: 'tt-1', day: 'Mon', time: '09:30 - 11:00', subjectName: 'Editorial & Information Design', room: 'Design Wing 108' },
      { id: 'tt-2', day: 'Tue', time: '10:30 - 12:00', subjectName: 'HCI Research Methods', room: 'Studio Hall 204' },
      { id: 'tt-3', day: 'Wed', time: '14:00 - 15:30', subjectName: 'Front-End Systems Architecture', room: 'Tech Lab 3B' },
      { id: 'tt-4', day: 'Thu', time: '10:30 - 12:00', subjectName: 'HCI Research Methods', room: 'Studio Hall 204' },
    ],
    knowledge: [
      {
        id: 'kn-1',
        title: 'Progressive Disclosure in Personal Tools',
        content:
          'Keep primary views calm by exposing advanced controls only when a user opens an item or switches into editing mode. Reduces cognitive friction by up to 40% during daily workflows.',
        source: 'Don Norman — Design of Everyday Things',
        category: 'Concepts',
        tags: ['ux', 'cognitive-load', 'interfaces'],
        relatedIds: ['kn-2'],
        createdAt: `${threeDaysAgoStr}T12:00:00.000Z`,
      },
      {
        id: 'kn-2',
        title: 'Swiss Grid Baseline Rhythm',
        content:
          'Aligning card padding, typography line heights, and icon baselines to a consistent 4px/8px spatial grid creates effortless visual harmony without heavy borders.',
        source: 'Josef Müller-Brockmann — Grid Systems',
        category: 'References',
        tags: ['typography', 'grids', 'editorial'],
        relatedIds: ['kn-1'],
        createdAt: `${twoDaysAgoStr}T16:00:00.000Z`,
      },
      {
        id: 'kn-3',
        title: '“How we spend our days is, of course, how we spend our lives.”',
        content:
          'A grounding reminder from Annie Dillard that daily systems and quiet habits shape long-term creative output more than sporadic sprints.',
        source: 'Annie Dillard — The Writing Life',
        category: 'Quotes',
        tags: ['reflection', 'craft'],
        relatedIds: [],
        createdAt: `${yesterdayStr}T09:00:00.000Z`,
      },
    ],
    careerJobs: [
      {
        id: 'job-1',
        company: 'Studio Kinfolk Digital',
        role: 'Product Design Intern',
        kind: 'Internship',
        appliedDate: yesterdayStr,
        status: 'Interview',
        link: 'https://example.com/kinfolk-role',
        notes: 'First portfolio walkthrough scheduled for next Tuesday.',
      },
      {
        id: 'job-2',
        company: 'Linearity Crafts',
        role: 'Junior UX Engineer',
        kind: 'Job',
        appliedDate: threeDaysAgoStr,
        status: 'Applied',
        link: 'https://example.com/linearity',
        notes: 'Submitted React + Figma design system case study.',
      },
      {
        id: 'job-3',
        company: 'Are.na Editorial Team',
        role: 'Design Fellow',
        kind: 'Internship',
        appliedDate: todayStr,
        status: 'Interested',
        link: 'https://www.are.na',
        notes: 'Drafting custom cover letter highlighting knowledge graphs.',
      },
    ],
    careerRecords: [
      {
        id: 'cr-1',
        section: 'resume',
        title: 'Product Design & Research CV (Fall 2026)',
        subtitle: '1-page editorial PDF tailored for studio roles',
        meta: 'Updated this week',
        date: todayStr,
      },
      {
        id: 'cr-2',
        section: 'skill',
        title: 'Design Systems & Token Architecture',
        subtitle: 'Figma Variables, Tailwind CSS, Accessible Components',
        meta: 'Advanced · 90%',
        date: todayStr,
      },
      {
        id: 'cr-3',
        section: 'freelance',
        title: 'Atelier Nord — Editorial Lookbook UI',
        subtitle: 'Freelance Retainer Invoice #104',
        meta: 'Paid',
        amount: 1650,
        date: `${todayStr.slice(0, 7)}-01`,
      },
      {
        id: 'cr-4',
        section: 'contact',
        title: 'Elena Vance, PhD',
        subtitle: 'Faculty Advisor · HCI Lab',
        meta: 'elena.vance@university.edu',
        date: twoDaysAgoStr,
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Autumn Portfolio Redesign',
        description: 'Rebuilding personal design portfolio with warm editorial case studies and interactive prototypes.',
        coverImage: '/src/assets/images/desk_editorial_1795116544232.jpg',
        progress: 72,
        startDate: `${todayStr.slice(0, 7)}-01`,
        deadline: inNineDaysStr,
        status: 'In Progress',
        milestones: [
          { id: 'pm-1', title: 'Audit 3 strongest case studies', done: true },
          { id: 'pm-2', title: 'Finalize typography & cream palette', done: true },
          { id: 'pm-3', title: 'Record interactive walkthrough clips', done: false },
        ],
        notes: 'Focus on showing design iterations rather than only final mockups.',
        links: [{ id: 'pl-1', label: 'Figma Master File', url: 'https://www.figma.com' }],
        activity: [
          { id: 'pa-1', text: 'Completed typography & palette milestone', at: yesterdayStr },
          { id: 'pa-2', text: 'Uploaded new desk cover image', at: todayStr },
        ],
      },
      {
        id: 'proj-2',
        title: 'CS-418 Capstone Research Paper',
        description: 'Mixed-methods study on calm personal knowledge workspaces for university students.',
        progress: 55,
        startDate: `${todayStr.slice(0, 7)}-04`,
        deadline: inFiveDaysStr,
        status: 'Review',
        milestones: [
          { id: 'pm-4', title: 'Conduct 6 contextual interviews', done: true },
          { id: 'pm-5', title: 'Synthesize findings & recommendations', done: false },
        ],
        notes: 'Include affinity clustering diagram in appendix.',
        links: [],
        activity: [{ id: 'pa-3', text: 'Drafted methodology section', at: twoDaysAgoStr }],
      },
    ],
    habits: [
      {
        id: 'hab-1',
        title: 'Morning 15-minute desk tidy & plan',
        frequency: 'daily',
        category: 'Focus',
        completedDates: [threeDaysAgoStr, twoDaysAgoStr, yesterdayStr, todayStr],
      },
      {
        id: 'hab-2',
        title: 'Read 20 pages before sleep',
        frequency: 'daily',
        category: 'Mindfulness',
        completedDates: [twoDaysAgoStr, yesterdayStr, todayStr],
      },
      {
        id: 'hab-3',
        title: '2L hydration & afternoon tea walk',
        frequency: 'daily',
        category: 'Wellness',
        completedDates: [threeDaysAgoStr, yesterdayStr],
      },
      {
        id: 'hab-4',
        title: 'Weekly finance & calendar review',
        frequency: 'weekly',
        category: 'Organization',
        completedDates: [twoDaysAgoStr],
      },
    ],
    goals: [
      {
        id: 'goal-1',
        title: 'Maintain 3.85+ GPA across Fall semester',
        timeframe: 'Quarterly',
        progress: 82,
        targetDate: '2026-12-20',
        milestones: [
          { id: 'gm-1', title: 'Keep 95%+ studio attendance', done: true },
          { id: 'gm-2', title: 'Complete CS-418 capstone early', done: false },
        ],
      },
      {
        id: 'goal-2',
        title: 'Publish 2 thoughtful design case studies',
        timeframe: 'Monthly',
        progress: 65,
        targetDate: inNineDaysStr,
        milestones: [
          { id: 'gm-3', title: 'Finish My Space architecture writeup', done: true },
          { id: 'gm-4', title: 'Publish Atelier Nord retrospective', done: false },
        ],
      },
    ],
    books: [
      {
        id: 'book-1',
        title: 'The Architecture of Happiness',
        author: 'Alain de Botton',
        category: 'Currently Reading',
        coverUrl: '/src/assets/images/book_cover_sage_1795116544695.jpg',
        currentPage: 168,
        totalPages: 280,
        rating: 5,
        notes: 'Beautiful reflections on how physical and digital environments shape inner calm.',
        updatedAt: todayStr,
      },
      {
        id: 'book-2',
        title: 'Grid Systems in Graphic Design',
        author: 'Josef Müller-Brockmann',
        category: 'Completed',
        coverUrl: '/src/assets/images/book_cover_blush_1795116543755.jpg',
        currentPage: 176,
        totalPages: 176,
        rating: 5,
        notes: 'Foundational reference for structured, breathable multi-column layouts.',
        updatedAt: threeDaysAgoStr,
      },
      {
        id: 'book-3',
        title: 'How to Do Nothing',
        author: 'Jenny Odell',
        category: 'Want to Read',
        currentPage: 0,
        totalPages: 256,
        rating: 0,
        notes: 'Recommended by Maya for digital intentionality research.',
        updatedAt: yesterdayStr,
      },
    ],
    media: createDefaultMediaSeed(todayStr, yesterdayStr, twoDaysAgoStr),
    ideas: [
      {
        id: 'idea-1',
        title: 'Seasonal Digital Garden Zine',
        description: 'Compile favorite essays, pressed flower scans, and quarterly reading notes into a printable 16-page risograph booklet.',
        category: 'Creative',
        status: 'Exploring',
        referenceUrl: 'https://www.are.na',
        isFavorite: true,
        createdAt: yesterdayStr,
      },
      {
        id: 'idea-2',
        title: 'Keyboard-First Daily Standup Note Template',
        description: 'A single 3-line morning prompt: One priority, one nice-to-have, one gratitude.',
        category: 'Productivity',
        status: 'In Progress',
        isFavorite: false,
        createdAt: twoDaysAgoStr,
      },
      {
        id: 'idea-3',
        title: 'Study Pomodoro + Ambient Rain Soundscape',
        description: 'Minimalist focus timer paired with paper-flip sound cues instead of harsh alarms.',
        category: 'Product',
        status: 'New',
        isFavorite: true,
        createdAt: todayStr,
      },
    ],
    gallery: [
      {
        id: 'gal-1',
        title: 'Morning Pressed Eucalyptus',
        description: 'Flatlay on cotton watercolor paper by the east window.',
        category: 'Memories',
        album: 'Autumn 2026',
        imageUrl: '/src/assets/images/journal_botanical_1795116543773.jpg',
        isFavorite: true,
        createdAt: todayStr,
      },
      {
        id: 'gal-2',
        title: 'Quiet Desk Corner',
        description: 'Illustration reference for my ideal studio desk setup.',
        category: 'Design Inspiration',
        album: 'Studio Moodboard',
        imageUrl: '/src/assets/images/desk_editorial_1795116544232.jpg',
        isFavorite: true,
        createdAt: yesterdayStr,
      },
      {
        id: 'gal-3',
        title: 'Sage Linen Binding Study',
        description: 'Foil-stamped botanical cover detail for zine inspiration.',
        category: 'Personal Collections',
        album: 'Print & Bookbinding',
        imageUrl: '/src/assets/images/book_cover_sage_1795116544695.jpg',
        isFavorite: false,
        createdAt: twoDaysAgoStr,
      },
    ],
    resources: [
      {
        id: 'res-1',
        title: 'Accessible Color Contrast Matrix',
        url: 'https://webaim.org/resources/contrastchecker/',
        category: 'Toolkit',
        notes: 'Check WCAG AA/AAA ratios for warm cream & sage palettes.',
        isFavorite: true,
        createdAt: twoDaysAgoStr,
      },
      {
        id: 'res-2',
        title: 'Academic Paper Synthesis Template',
        url: 'https://scholar.google.com',
        category: 'Template',
        notes: 'Structured 5-question summary frame for literature reviews.',
        isFavorite: false,
        createdAt: yesterdayStr,
      },
    ],
    emergency: {
      id: 'em-1',
      bloodType: 'O+',
      allergies: 'Penicillin (mild skin sensitivity)',
      medicalNotes: 'Wears corrective lenses for reading (-1.50). Keep spare glasses in studio tote.',
      insuranceProvider: 'Pacific Student Care Plan',
      insurancePolicyNumber: 'PSC-2026-88412',
      homeAddress: '418 Maplewood Terrace, Apt 3B, Portland, OR',
      emergencyPlan: 'In case of urgent travel or campus emergency, notify Hannah Lin first and share spare apartment key code stored in physical desk lockbox.',
      contacts: [
        {
          id: 'ec-1',
          name: 'Hannah Lin',
          relation: 'Sister & Primary Contact',
          phone: '(503) 555-0148',
          email: 'hannah.lin@example.com',
        },
        {
          id: 'ec-2',
          name: 'Campus Health & Urgent Clinic',
          relation: 'Medical',
          phone: '(503) 555-0199',
          email: 'clinic@university.edu',
        },
      ],
      importantDocs: [
        { id: 'ed-1', label: 'Passport Renewal Due', value: 'August 2030' },
        { id: 'ed-2', label: 'University Student ID', value: 'STU-904218' },
      ],
    },
    aiThreads: [
      {
        id: 'ai-1',
        title: 'Workspace Welcome',
        messages: [
          {
            id: 'aim-1',
            role: 'assistant',
            text: 'Welcome to your private AI Assistant. Choose which parts of your workspace I am allowed to read above, then ask me to summarize notes, extract tasks, generate study flashcards, or organize rough thoughts.',
            timestamp: `${todayStr}T09:00:00.000Z`,
          },
        ],
        updatedAt: `${todayStr}T09:00:00.000Z`,
      },
    ],
    notifications: [
      {
        id: 'not-1',
        title: 'CS-418 Studio Critique today at 2:00 PM',
        detail: 'Studio Hall 204 · Finalize affinity diagram slides beforehand.',
        time: '1h ago',
        read: false,
        targetPage: 'calendar',
      },
      {
        id: 'not-2',
        title: 'Internship portfolio submission due tomorrow',
        detail: 'Studio Kinfolk Digital · High priority task',
        time: '3h ago',
        read: false,
        targetPage: 'tasks',
      },
      {
        id: 'not-3',
        title: '4-day morning planning streak',
        detail: 'Keep your momentum going in Goals & Habits.',
        time: 'Yesterday',
        read: true,
        targetPage: 'habits',
      },
    ],
  };
}

export function createDefaultMediaSeed(
  todayStr: string,
  yesterdayStr: string,
  twoDaysAgoStr: string
): MediaItem[] {
  return [
    {
      id: 'med-1',
      mediaType: 'music',
      title: 'In Rainbows',
      creator: 'Radiohead',
      genre: 'Art Rock',
      year: '2007',
      status: 'Current',
      rating: 5,
      url: 'https://open.spotify.com/search/In%20Rainbows%20Radiohead',
      isFavorite: true,
      notes: 'Warm analog texture for late-night design and study sessions.',
      updatedAt: todayStr,
    },
    {
      id: 'med-2',
      mediaType: 'movie',
      title: 'Past Lives',
      creator: 'Celine Song',
      genre: 'Drama / Romance',
      year: '2023',
      status: 'Completed',
      rating: 5,
      url: 'https://letterboxd.com/film/past-lives/',
      isFavorite: true,
      notes: 'Quiet, lingering pacing and unforgettable framing in every scene.',
      updatedAt: yesterdayStr,
    },
    {
      id: 'med-3',
      mediaType: 'music',
      title: 'Promises',
      creator: 'Floating Points & Pharoah Sanders',
      genre: 'Ambient Jazz',
      year: '2021',
      status: 'Queue',
      rating: 0,
      url: 'https://open.spotify.com/search/Promises%20Floating%20Points',
      isFavorite: false,
      notes: 'Saved to listen start-to-finish on a rainy Sunday morning.',
      updatedAt: twoDaysAgoStr,
    },
    {
      id: 'med-4',
      mediaType: 'movie',
      title: 'Perfect Days',
      creator: 'Wim Wenders',
      genre: 'Cinema',
      year: '2023',
      status: 'Completed',
      rating: 5,
      url: 'https://letterboxd.com/film/perfect-days-2023/',
      isFavorite: true,
      notes: 'A gentle reminder to notice morning sunlight, cassette tapes, and small daily rituals.',
      updatedAt: twoDaysAgoStr,
    },
    {
      id: 'med-5',
      mediaType: 'movie',
      title: 'Whisper of the Heart',
      creator: 'Yoshifumi Kondō',
      genre: 'Animation',
      year: '1995',
      status: 'Queue',
      rating: 0,
      url: 'https://letterboxd.com/film/whisper-of-the-heart/',
      isFavorite: false,
      notes: 'Cozy Ghibli rewatch saved for after finals.',
      updatedAt: yesterdayStr,
    },
  ];
}
