import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const CONFIG_FILE = path.join(process.cwd(), 'system_config.json');

// Helper to get system config
function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  return {
    systemName: 'Academic LMS Portal',
    allowRegistration: true,
    riskThresholdDays: 5,
    minPassingScore: 45
  };
}

// Helper to write system config
function writeConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing config file:', err);
    return false;
  }
}

// 1. User Accounts Management - Get All Users
export async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// 2. User Accounts Management - Update User Role / Deactivate
export async function updateUserRole(req, res) {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Role is required' });
  }

  const normalizedRole = role.toUpperCase();
  if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be STUDENT, INSTRUCTOR, or ADMIN' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole },
      select: { id: true, name: true, email: true, role: true }
    });

    return res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
}

export async function deleteUser(req, res) {
  const { userId } = req.params;

  try {
    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'You cannot deactivate or delete your own account' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return res.json({ message: 'User deactivated and removed from system successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to deactivate user' });
  }
}

// 3. Course Approval - List pending/all
export async function getCoursesApproval(req, res) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(courses);
  } catch (error) {
    console.error('Error fetching courses for approval:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

// 4. Course Approval - Update Status
export async function updateCourseStatus(req, res) {
  const { courseId } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'

  if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
  }

  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { status: status.toUpperCase() },
      include: {
        instructor: {
          select: { name: true, email: true }
        }
      }
    });

    return res.json({ message: `Course status updated to ${status}`, course });
  } catch (error) {
    console.error('Error updating course status:', error);
    return res.status(500).json({ error: 'Failed to update course status' });
  }
}

// 5. Global Reports
export async function getGlobalReports(req, res) {
  try {
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalInstructors = await prisma.user.count({ where: { role: 'INSTRUCTOR' } });
    
    const totalEnrollments = await prisma.enrollment.count();
    const totalCourses = await prisma.course.count();

    // Overall Average Performance
    const submissions = await prisma.submission.findMany({
      include: {
        assessment: {
          select: { maxScore: true }
        }
      }
    });

    let overallAvgScore = 0;
    if (submissions.length > 0) {
      let totalEarned = 0;
      let totalMax = 0;
      submissions.forEach(sub => {
        totalEarned += sub.score;
        totalMax += sub.assessment.maxScore;
      });
      overallAvgScore = totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
    }

    // Dropout Risk Count
    const dropoutRiskCount = await prisma.analyticsRecord.count({
      where: {
        riskLevel: 'High Risk'
      }
    });

    const moderateRiskCount = await prisma.analyticsRecord.count({
      where: {
        riskLevel: 'Moderate Risk'
      }
    });

    // Submissions distribution
    const coursesStats = await prisma.course.findMany({
      include: {
        _count: {
          select: { enrollments: true }
        },
        instructor: {
          select: { name: true }
        }
      }
    });

    const courseEnrolmentReport = coursesStats.map(c => ({
      courseTitle: c.title,
      instructor: c.instructor.name,
      status: c.status,
      enrolledCount: c._count.enrollments
    }));

    return res.json({
      summary: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalEnrollments,
        totalCourses,
        overallAvgScore,
        dropoutRiskCount,
        moderateRiskCount
      },
      courseEnrolmentReport
    });
  } catch (error) {
    console.error('Error compiling global reports:', error);
    return res.status(500).json({ error: 'Failed to generate system report' });
  }
}

// 6. System Configuration
export async function getConfig(req, res) {
  const config = readConfig();
  return res.json(config);
}

export async function updateConfig(req, res) {
  const newConfig = req.body;
  const currentConfig = readConfig();

  const mergedConfig = { ...currentConfig, ...newConfig };
  
  if (writeConfig(mergedConfig)) {
    return res.json({ message: 'System configuration updated successfully', config: mergedConfig });
  } else {
    return res.status(500).json({ error: 'Failed to save system configuration' });
  }
}
