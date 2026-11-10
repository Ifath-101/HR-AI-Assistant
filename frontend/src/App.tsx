import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { ChatInterface } from './components/ChatInterface';
import { LeaveProfileView } from './components/LeaveProfileView';
import { DocumentsView } from './components/DocumentsView';
import { EmployeesView } from './components/EmployeesView';
import { CompanyPoliciesView } from './components/CompanyPoliciesView';
import { FloatingAssistantWidget } from './components/FloatingAssistantWidget';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('assistant');
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);

  const loadCounts = async (role: string) => {
    try {
      if (role === 'admin') {
        const [docs, emps] = await Promise.all([
          api.getDocuments(false),
          api.getEmployees()
        ]);
        const activeDocs = docs.filter(d => d.is_latest);
        setDocumentCount(activeDocs.length);
        setEmployeeCount(emps.length);
      } else {
        const activeDocs = await api.getDocuments(true);
        setDocumentCount(activeDocs.length);
      }
    } catch (e) {
      console.error('Error loading counts:', e);
    }
  };

  useEffect(() => {
    // Check if user session already exists in localStorage
    const savedToken = localStorage.getItem('peoplesphere_token');
    if (savedToken) {
      api.getMe()
        .then((user) => {
          setCurrentUser(user);
          loadCounts(user.role);
        })
        .catch(() => {
          api.logout();
          setCurrentUser(null);
        })
        .finally(() => {
          setLoadingInitial(false);
        });
    } else {
      setLoadingInitial(false);
    }

    // Listen to token expiry events from api client
    const handleAuthExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('assistant');
    loadCounts(user.role);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('assistant');
  };

  const adminQuickPrompts = [
    "Give me the details of all the employees",
    "What is the annual leave carry-forward rule?",
    "What are the medical certificate requirements?",
    "Who is Jane Doe's reporting manager?",
    "What is the notice period for taking 3 or more leave days?",
    "Can employees encash unused annual leave?"
  ];

  const employeeQuickPrompts = [
    "How many annual leave days do I have remaining?",
    "Can I carry forward my remaining annual leave?",
    "What is the process for applying for annual leave?",
    "Who is my reporting manager?",
    "How many medical leave days have I used?",
    "What are the rules for medical leave certificate?"
  ];

  if (loadingInitial) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="animate-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
          <span>Loading PeopleSphere HR Assistant...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#f8fafc'
    }}>
      {/* Left Navigation Menu Bar */}
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        documentCount={documentCount}
        employeeCount={employeeCount}
      />

      {/* Main Right Content Panel */}
      <main style={{
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'assistant' && (
          <div style={{
            height: '100%',
            padding: '1.25rem 1.75rem',
            boxSizing: 'border-box'
          }}>
            <ChatInterface
              user={currentUser}
              quickPrompts={isAdmin ? adminQuickPrompts : employeeQuickPrompts}
              title={isAdmin ? "HR Administrative Assistant" : "HR Policy Assistant"}
              welcomeTitle={isAdmin ? `HR Administrative Console` : `Hello, ${currentUser.name.split(' ')[0]}`}
              welcomeSubtitle={
                isAdmin
                  ? "You have full administrative privileges. You can verify HR policy clauses and query organization-wide employee records."
                  : "Ask questions about company policies, your leave entitlement, or medical benefits."
              }
              initialQuery={assistantInitialQuery}
              onClearInitialQuery={() => setAssistantInitialQuery(undefined)}
            />
          </div>
        )}

        {/* Company Policies for Employees */}
        {!isAdmin && activeTab === 'policies' && (
          <CompanyPoliciesView
            onNavigateToAssistant={(prefilled) => {
              setAssistantInitialQuery(prefilled);
              setActiveTab('assistant');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <LeaveProfileView
            initialUser={currentUser}
            onNavigateToAssistant={() => setActiveTab('assistant')}
          />
        )}

        {isAdmin && activeTab === 'documents' && (
          <DocumentsView
            onCountChange={(count) => setDocumentCount(count)}
          />
        )}

        {isAdmin && activeTab === 'employees' && (
          <EmployeesView
            onCountChange={(count) => setEmployeeCount(count)}
          />
        )}

        {/* Floating AI Assistant Bot Widget on All Other Pages */}
        {activeTab !== 'assistant' && (
          <FloatingAssistantWidget
            user={currentUser}
            onExpandToFullPage={(prefilled) => {
              if (prefilled) setAssistantInitialQuery(prefilled);
              setActiveTab('assistant');
            }}
            quickPrompts={isAdmin ? adminQuickPrompts : employeeQuickPrompts}
          />
        )}
      </main>
    </div>
  );
};

export default App;
