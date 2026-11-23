/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { LoadingScreen } from './components/BrandMark';
import { AuthScreen } from './components/AuthScreen';
import { AppShell } from './components/AppShell';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SessionMoodBar } from './components/MoodChecker';
import { ToastContainer } from './components/ui/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { NotesPage } from './pages/NotesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { TasksPage } from './pages/TasksPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { JournalPage } from './pages/JournalPage';
import { CalendarPage } from './pages/CalendarPage';
import { FinancePage } from './pages/FinancePage';
import { StudyHubPage } from './pages/StudyHubPage';
import { KnowledgeLibraryPage } from './pages/KnowledgeLibraryPage';
import { CareerHubPage } from './pages/CareerHubPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { HabitsGoalsPage } from './pages/HabitsGoalsPage';
import { ReadingTrackerPage } from './pages/ReadingTrackerPage';
import { MediaPage } from './pages/MediaPage';
import { IdeaBankPage } from './pages/IdeaBankPage';
import { GalleryPage } from './pages/GalleryPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import {
  EmergencyInfoPage,
  HelpSupportPage,
  SavedResourcesPage,
  SharedDocumentPage,
} from './pages/MorePages';
import { SettingsPage } from './pages/SettingsPage';

function WorkspaceRouter() {
  const { user, workspace, loading, activePage } = useWorkspace();

  // Check if visiting an explicitly shared document URL (?share=...)
  const shareToken = new URLSearchParams(window.location.search).get('share');
  if (shareToken) {
    return <SharedDocumentPage shareToken={shareToken} />;
  }

  if (loading) return <LoadingScreen />;
  if (!user || !workspace) return <AuthScreen />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'notes':
        return <NotesPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'bookmarks':
        return <BookmarksPage />;
      case 'journal':
        return <JournalPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'finance':
        return <FinancePage />;
      case 'study':
        return <StudyHubPage />;
      case 'knowledge':
        return <KnowledgeLibraryPage />;
      case 'career':
        return <CareerHubPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'habits':
        return <HabitsGoalsPage />;
      case 'reading':
        return <ReadingTrackerPage />;
      case 'media':
        return <MediaPage />;
      case 'ideas':
        return <IdeaBankPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'ai':
        return <AIAssistantPage />;
      case 'resources':
        return <SavedResourcesPage />;
      case 'emergency':
        return <EmergencyInfoPage />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpSupportPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppShell>
      {renderPage()}
      <QuickCaptureModal />
      <GlobalSearchModal />
      <SessionMoodBar />
    </AppShell>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceRouter />
      <ToastContainer />
    </WorkspaceProvider>
  );
}
