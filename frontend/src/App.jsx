import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

// Pages
import LoginRegister from './pages/LoginRegister';
import StudentDashboard from './pages/StudentDashboard';
import StudentCourses from './pages/StudentCourses';
import StudentCourseDetails from './pages/StudentCourseDetails';
import StudentAssessment from './pages/StudentAssessment';
import StudentForum from './pages/StudentForum';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourseBuilder from './pages/InstructorCourseBuilder';
import InstructorStudentAnalytics from './pages/InstructorStudentAnalytics';
import InstructorRiskAlerts from './pages/InstructorRiskAlerts';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [currentPath, setCurrentPath] = useState(() => {
    const savedToken = localStorage.getItem('token');
    const savedPath = localStorage.getItem('currentPath');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const usr = JSON.parse(savedUser);
        if (savedPath && savedPath !== 'login') return savedPath;
        if (usr.role === 'STUDENT') return 'student/dashboard';
        if (usr.role === 'INSTRUCTOR') return 'instructor/dashboard';
        return 'admin/dashboard';
      } catch (e) {}
    }
    return 'login';
  });
  
  const [toast, setToast] = useState(null);
  const [dataCache, setDataCache] = useState({});

  // Routing params
  const [selectedCourseId, setSelectedCourseId] = useState(() => localStorage.getItem('selectedCourseId') || null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(() => localStorage.getItem('selectedAssessmentId') || null);
  const [selectedStudentId, setSelectedStudentId] = useState(() => localStorage.getItem('selectedStudentId') || null);

  const [messages, setMessages] = useState([]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Sync state to localStorage
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (user && currentPath !== 'login') localStorage.setItem('currentPath', currentPath);
    else localStorage.removeItem('currentPath');
  }, [currentPath, user]);

  useEffect(() => {
    if (selectedCourseId) localStorage.setItem('selectedCourseId', selectedCourseId);
    else localStorage.removeItem('selectedCourseId');
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedAssessmentId) localStorage.setItem('selectedAssessmentId', selectedAssessmentId);
    else localStorage.removeItem('selectedAssessmentId');
  }, [selectedAssessmentId]);

  useEffect(() => {
    if (selectedStudentId) localStorage.setItem('selectedStudentId', selectedStudentId);
    else localStorage.removeItem('selectedStudentId');
  }, [selectedStudentId]);

  const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, options);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'API Error');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const loadAdminDashboardData = async () => {
    try {
      const [reports, users, courses, config] = await Promise.all([
        apiCall('/api/admin/reports'),
        apiCall('/api/admin/users'),
        apiCall('/api/admin/courses'),
        apiCall('/api/admin/config')
      ]);
      setDataCache(prev => ({
        ...prev,
        adminDash: { reports, users, courses, config }
      }));
    } catch (e) {
      console.error("Failed to load admin data", e);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      if (user.role === 'STUDENT') {
        const d = await apiCall('/api/student/dashboard');
        setDataCache(prev => ({ ...prev, studentDash: d }));
      } else if (user.role === 'INSTRUCTOR') {
        const d = await apiCall('/api/instructor/dashboard');
        setDataCache(prev => ({ ...prev, instDash: d }));
      } else if (user.role === 'ADMIN') {
        await loadAdminDashboardData();
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (user && (currentPath.includes('dashboard') || currentPath === 'login')) {
      loadDashboardData();
    }
  }, [user, currentPath]);

  const fetchStudentMessages = async () => {
    if (!user || user.role !== 'STUDENT') return;
    try {
      const msgs = await apiCall('/api/student/messages');
      setMessages(msgs);
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  const handleMarkMessageAsRead = async (messageId) => {
    try {
      await apiCall(`/api/student/messages/${messageId}/read`, 'PUT');
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, isRead: true } : m))
      );
    } catch (e) {
      console.error('Error marking message as read:', e);
    }
  };

  useEffect(() => {
    if (user && user.role === 'STUDENT') {
      fetchStudentMessages();
      const interval = setInterval(fetchStudentMessages, 5000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [user]);

  const handleLogin = (tkn, usr) => {
    setToken(tkn);
    setUser(usr);
    showToast(`Welcome back, ${usr.name}!`);
    if (usr.role === 'STUDENT') setCurrentPath('student/dashboard');
    else if (usr.role === 'INSTRUCTOR') setCurrentPath('instructor/dashboard');
    else setCurrentPath('admin/dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setDataCache({});
    setMessages([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentPath');
    localStorage.removeItem('selectedCourseId');
    localStorage.removeItem('selectedAssessmentId');
    localStorage.removeItem('selectedStudentId');
    setCurrentPath('login');
    showToast('Logged out successfully', 'info');
  };

  // Student Actions
  const handleEnroll = async (courseId) => {
    await apiCall('/api/student/courses/enroll', 'POST', { courseId });
    showToast('Successfully enrolled in course!');
    // Refresh catalog
    const c = await apiCall('/api/student/courses');
    setDataCache(prev => ({ ...prev, catalog: c }));
  };

  const handleCompleteModule = async (courseId, moduleId) => {
    await apiCall(`/api/student/courses/${courseId}/modules/${moduleId}/complete`, 'POST');
    showToast('Module marked as complete!');
    // Refresh course details
    const cd = await apiCall(`/api/student/courses/${courseId}`);
    setDataCache(prev => ({ ...prev, currentCourse: cd }));
  };

  const handleSubmitAssessment = async (assessmentId, courseId, payload) => {
    await apiCall(`/api/student/assessments/${assessmentId}/submit`, 'POST', payload);
    showToast('Assessment submitted successfully!');
    // Go back to course
    setCurrentPath(`student/course/${courseId}`);
  };

  const handlePostForum = async (courseId, content, parentId) => {
    await apiCall(`/api/student/forum/${courseId}`, 'POST', { content, parentId });
    showToast('Message posted');
    const f = await apiCall(`/api/student/forum/${courseId}`);
    setDataCache(prev => ({ ...prev, forum: f }));
  };

  // Instructor Actions
  const handleCreateCourse = async (payload) => {
    await apiCall('/api/instructor/courses', 'POST', payload);
    showToast('Course created and is pending approval.');
    const c = await apiCall('/api/instructor/courses');
    setDataCache(prev => ({ ...prev, instructorCourses: c }));
  };

  const handleAddModule = async (courseId, payload) => {
    await apiCall(`/api/instructor/courses/${courseId}/modules`, 'POST', payload);
    showToast('Module added successfully!');
    const c = await apiCall('/api/instructor/courses');
    setDataCache(prev => ({ ...prev, instructorCourses: c }));
  };

  const handleDeleteModule = async (courseId, moduleId) => {
    await apiCall(`/api/instructor/courses/${courseId}/modules/${moduleId}`, 'DELETE');
    showToast('Module deleted successfully!');
    const c = await apiCall('/api/instructor/courses');
    setDataCache(prev => ({ ...prev, instructorCourses: c }));
  };

  const handleCreateAssessment = async (courseId, payload) => {
    await apiCall('/api/instructor/assessments', 'POST', { courseId, ...payload });
    showToast('Assessment created successfully!');
    const c = await apiCall('/api/instructor/courses');
    setDataCache(prev => ({ ...prev, instructorCourses: c }));
  };

  const handleTriggerIntervention = async (studentId, courseId, action = 'Send Message', notes = '') => {
    const finalCourseId = courseId || selectedCourseId || (dataCache.instDash?.courses?.[0]?.id);
    try {
      const res = await apiCall(`/api/instructor/interventions`, 'POST', { 
        studentId, 
        courseId: finalCourseId, 
        action, 
        notes 
      });
      showToast(res.message || `Intervention action executed successfully.`, 'success');
    } catch (e) {
      // apiCall already displays toast on failure
    }
  };

  // Admin Actions
  const handleApproveCourse = async (courseId) => {
    await apiCall(`/api/admin/courses/${courseId}/status`, 'PUT', { status: 'APPROVED' });
    showToast('Course approved successfully!');
    await loadAdminDashboardData();
  };

  const handleUpdateUserRole = async (userId, role) => {
    await apiCall(`/api/admin/users/${userId}/role`, 'PUT', { role });
    showToast('User role updated successfully!');
    await loadAdminDashboardData();
  };

  const handleDeleteUser = async (userId) => {
    await apiCall(`/api/admin/users/${userId}`, 'DELETE');
    showToast('User account deactivated.');
    await loadAdminDashboardData();
  };

  const handleUpdateConfig = async (newConfig) => {
    await apiCall(`/api/admin/config`, 'PUT', newConfig);
    showToast('System configuration saved.');
    await loadAdminDashboardData();
  };

  // Loaders for specific paths
  useEffect(() => {
    if(!user) return;
    const fetchPathData = async () => {
      const parts = currentPath.split('/');
      const lastPart = parts[parts.length - 1];

      if (currentPath === 'student/courses') {
        try {
          const c = await apiCall('/api/student/courses');
          setDataCache(prev => ({ ...prev, catalog: c }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, catalog: { error: e.message || 'Failed to load catalog' } }));
        }
      } else if (currentPath.startsWith('student/course/')) {
        setDataCache(prev => ({ ...prev, currentCourse: null }));
        try {
          const cd = await apiCall(`/api/student/courses/${lastPart}`);
          setDataCache(prev => ({ ...prev, currentCourse: cd }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, currentCourse: { error: e.message || 'Failed to load course details' } }));
        }
      } else if (currentPath.startsWith('student/assessment/')) {
        setDataCache(prev => ({ ...prev, currentAssessment: null }));
        try {
          const a = await apiCall(`/api/student/assessments/${lastPart}`);
          setDataCache(prev => ({ ...prev, currentAssessment: a }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, currentAssessment: { error: e.message || 'Failed to load assessment' } }));
        }
      } else if (currentPath.startsWith('student/forum/')) {
        setDataCache(prev => ({ ...prev, forum: null }));
        try {
          const f = await apiCall(`/api/student/forum/${lastPart}`);
          setDataCache(prev => ({ ...prev, forum: f }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, forum: { error: e.message || 'Failed to load forum posts' } }));
        }
      } else if (currentPath.startsWith('instructor/analytics/')) {
        setDataCache(prev => ({ ...prev, currentStudentAnalytics: null }));
        try {
          const sa = await apiCall(`/api/instructor/analytics/student/${lastPart}`);
          setDataCache(prev => ({ ...prev, currentStudentAnalytics: sa }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, currentStudentAnalytics: { error: e.message || 'Failed to load student analytics' } }));
        }
      } else if (currentPath === 'instructor/alerts') {
        setDataCache(prev => ({ ...prev, riskAlerts: null }));
        try {
          const al = await apiCall('/api/instructor/risk-alerts');
          setDataCache(prev => ({ ...prev, riskAlerts: al }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, riskAlerts: { error: e.message || 'Failed to load risk alerts' } }));
        }
      } else if (currentPath === 'instructor/courses') {
        setDataCache(prev => ({ ...prev, instructorCourses: null }));
        try {
          const c = await apiCall('/api/instructor/courses');
          setDataCache(prev => ({ ...prev, instructorCourses: c }));
        } catch (e) {
          setDataCache(prev => ({ ...prev, instructorCourses: { error: e.message || 'Failed to load courses' } }));
        }
      } else if (currentPath.startsWith('admin/')) {
        try {
          await loadAdminDashboardData();
        } catch (e) {
          console.error("Failed to load admin dashboard data", e);
        }
      }
    };
    fetchPathData();
  }, [currentPath]);

  if (!user || currentPath === 'login') {
    return (
      <>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <LoginRegister onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <Navbar user={user} currentPath={currentPath} onNavigate={setCurrentPath} onLogout={handleLogout} />
      
      <main className="flex-1 w-full relative">
        {/* Student Routes */}
        {currentPath === 'student/dashboard' && (
          <StudentDashboard 
            data={dataCache.studentDash} 
            messages={messages}
            onMarkMessageAsRead={handleMarkMessageAsRead}
            onNavigate={setCurrentPath} 
            onSelectCourse={setSelectedCourseId} 
            onSelectAssessment={setSelectedAssessmentId} 
          />
        )}
        {currentPath === 'student/courses' && (
          <StudentCourses courses={dataCache.catalog || []} onEnroll={handleEnroll} onNavigate={setCurrentPath} onSelectCourse={setSelectedCourseId} />
        )}
        {currentPath.startsWith('student/course/') && (
          <StudentCourseDetails course={dataCache.currentCourse} onCompleteModule={handleCompleteModule} onNavigate={setCurrentPath} onSelectAssessment={setSelectedAssessmentId} />
        )}
        {currentPath.startsWith('student/assessment/') && (
          <StudentAssessment assessmentData={dataCache.currentAssessment} onNavigate={setCurrentPath} onSubmit={handleSubmitAssessment} />
        )}
        {currentPath.startsWith('student/forum/') && (
          <StudentForum posts={dataCache.forum || []} courseId={selectedCourseId} onNavigate={setCurrentPath} onPostMessage={handlePostForum} />
        )}

        {/* Instructor Routes */}
        {currentPath === 'instructor/dashboard' && (
          <InstructorDashboard data={dataCache.instDash} onNavigate={setCurrentPath} onSelectStudent={setSelectedStudentId} />
        )}
        {currentPath === 'instructor/courses' && (
          <InstructorCourseBuilder 
            courses={dataCache.instructorCourses || []} 
            onCreateCourse={handleCreateCourse} 
            onAddModule={handleAddModule} 
            onDeleteModule={handleDeleteModule} 
            onCreateAssessment={handleCreateAssessment} 
          />
        )}
        {currentPath.startsWith('instructor/analytics/') && (
          <InstructorStudentAnalytics studentData={dataCache.currentStudentAnalytics} onNavigate={setCurrentPath} onTriggerIntervention={handleTriggerIntervention} />
        )}
        {currentPath === 'instructor/alerts' && (
          <InstructorRiskAlerts alerts={dataCache.riskAlerts || []} onNavigate={setCurrentPath} onSelectStudent={setSelectedStudentId} onTriggerIntervention={handleTriggerIntervention} />
        )}

        {/* Admin Routes */}
        {currentPath.startsWith('admin/') && (
          <AdminDashboard
            view={currentPath.split('/')[1] || 'dashboard'}
            data={dataCache.adminDash}
            onApproveCourse={handleApproveCourse}
            onUpdateUserRole={handleUpdateUserRole}
            onDeleteUser={handleDeleteUser}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
      </main>
    </div>
  );
}
