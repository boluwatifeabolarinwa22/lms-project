import express from 'express';
import cors from 'cors';
import { register, login, me, logout } from './controllers/authController.js';
import { 
  getDashboard as getStudentDashboard, 
  getCourses as getStudentCourses, 
  enrollCourse, 
  getCourseDetails, 
  completeModule, 
  getAssessment, 
  submitAssessment, 
  getForumPosts, 
  createForumPost, 
  getProfile,
  getStudentMessages,
  markMessageAsRead
} from './controllers/studentController.js';
import { 
  getDashboard as getInstructorDashboard, 
  getInstructorCourses, 
  createCourse, 
  editCourse, 
  createAssessment, 
  getStudentAnalytics, 
  getRiskAlerts, 
  triggerInterventionAction,
  addModule,
  deleteModule
} from './controllers/instructorController.js';
import { 
  getUsers, 
  updateUserRole, 
  deleteUser, 
  getCoursesApproval, 
  updateCourseStatus, 
  getGlobalReports, 
  getConfig, 
  updateConfig 
} from './controllers/adminController.js';
import { forceRecompute } from './controllers/analyticsController.js';
import { authenticateToken, authorizeRoles } from './middleware/authMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Public Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);

// Protected User details
app.get('/api/auth/me', authenticateToken, me);

// Student Routes
app.get('/api/student/dashboard', authenticateToken, authorizeRoles('STUDENT'), getStudentDashboard);
app.get('/api/student/courses', authenticateToken, authorizeRoles('STUDENT'), getStudentCourses);
app.post('/api/student/courses/enroll', authenticateToken, authorizeRoles('STUDENT'), enrollCourse);
app.get('/api/student/courses/:id', authenticateToken, authorizeRoles('STUDENT'), getCourseDetails);
app.post('/api/student/courses/:courseId/modules/:moduleId/complete', authenticateToken, authorizeRoles('STUDENT'), completeModule);
app.get('/api/student/assessments/:id', authenticateToken, authorizeRoles('STUDENT'), getAssessment);
app.post('/api/student/assessments/:id/submit', authenticateToken, authorizeRoles('STUDENT'), submitAssessment);
app.get('/api/student/forum/:courseId', authenticateToken, getForumPosts); // Shared: also visible to instructor
app.post('/api/student/forum/:courseId', authenticateToken, createForumPost); // Shared
app.get('/api/student/profile', authenticateToken, authorizeRoles('STUDENT'), getProfile);
app.get('/api/student/messages', authenticateToken, authorizeRoles('STUDENT'), getStudentMessages);
app.put('/api/student/messages/:id/read', authenticateToken, authorizeRoles('STUDENT'), markMessageAsRead);

// Instructor Routes
app.get('/api/instructor/dashboard', authenticateToken, authorizeRoles('INSTRUCTOR'), getInstructorDashboard);
app.get('/api/instructor/courses', authenticateToken, authorizeRoles('INSTRUCTOR'), getInstructorCourses);
app.post('/api/instructor/courses', authenticateToken, authorizeRoles('INSTRUCTOR'), createCourse);
app.put('/api/instructor/courses/:id', authenticateToken, authorizeRoles('INSTRUCTOR'), editCourse);
app.post('/api/instructor/assessments', authenticateToken, authorizeRoles('INSTRUCTOR'), createAssessment);
app.get('/api/instructor/analytics/student/:studentId', authenticateToken, authorizeRoles('INSTRUCTOR'), getStudentAnalytics);
app.get('/api/instructor/risk-alerts', authenticateToken, authorizeRoles('INSTRUCTOR'), getRiskAlerts);
app.post('/api/instructor/interventions', authenticateToken, authorizeRoles('INSTRUCTOR'), triggerInterventionAction);
app.post('/api/instructor/courses/:courseId/modules', authenticateToken, authorizeRoles('INSTRUCTOR'), addModule);
app.delete('/api/instructor/courses/:courseId/modules/:moduleId', authenticateToken, authorizeRoles('INSTRUCTOR'), deleteModule);

// Admin Routes
app.get('/api/admin/users', authenticateToken, authorizeRoles('ADMIN'), getUsers);
app.put('/api/admin/users/:userId/role', authenticateToken, authorizeRoles('ADMIN'), updateUserRole);
app.delete('/api/admin/users/:userId', authenticateToken, authorizeRoles('ADMIN'), deleteUser);
app.get('/api/admin/courses', authenticateToken, authorizeRoles('ADMIN'), getCoursesApproval);
app.put('/api/admin/courses/:courseId/status', authenticateToken, authorizeRoles('ADMIN'), updateCourseStatus);
app.get('/api/admin/reports', authenticateToken, authorizeRoles('ADMIN'), getGlobalReports);
app.get('/api/admin/config', authenticateToken, authorizeRoles('ADMIN'), getConfig);
app.put('/api/admin/config', authenticateToken, authorizeRoles('ADMIN'), updateConfig);

// Shared Manual Analytics Recompute
app.post('/api/analytics/recompute/:studentId/:courseId', authenticateToken, authorizeRoles('INSTRUCTOR', 'ADMIN'), forceRecompute);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Something went wrong inside the server' });
});

export default app;
