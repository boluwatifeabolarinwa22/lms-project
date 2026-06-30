import { PrismaClient } from '@prisma/client';
import { computeAnalytics } from '../services/analyticsEngine.js';

const prisma = new PrismaClient();

// 1. Instructor Dashboard
export async function getDashboard(req, res) {
  const instructorId = req.user.id;

  try {
    // Get all courses taught by the instructor
    const courses = await prisma.course.findMany({
      where: { instructorId }
    });

    const courseIds = courses.map(c => c.id);

    // Get all enrollments for these courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: { in: courseIds }
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { title: true }
        }
      }
    });

    const enrolledStudentIds = Array.from(new Set(enrollments.map(e => e.studentId)));

    // Get analytics records
    const analytics = await prisma.analyticsRecord.findMany({
      where: {
        courseId: { in: courseIds },
        studentId: { in: enrolledStudentIds }
      },
      include: {
        student: {
          select: { name: true, email: true }
        }
      }
    });

    // Calculate class overview stats
    const avgEngagementScore = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.engagementScore, 0) / analytics.length
      : 0;

    // Performance distribution (Distinction, Merit, Pass, At Risk / Fail)
    const distribution = {
      Distinction: 0,
      Merit: 0,
      Pass: 0,
      'At Risk / Fail': 0
    };

    analytics.forEach(a => {
      const category = a.performanceCategory;
      if (distribution[category] !== undefined) {
        distribution[category]++;
      } else {
        distribution['At Risk / Fail']++;
      }
    });

    // Ranked list of at-risk students (High Risk first, then Moderate Risk)
    // Map with enrollment details for display
    const atRiskStudents = analytics
      .filter(a => a.riskLevel === 'High Risk' || a.riskLevel === 'Moderate Risk')
      .map(a => {
        const studentEnrollment = enrollments.find(e => e.studentId === a.studentId && e.courseId === a.courseId);
        return {
          id: a.id,
          studentId: a.studentId,
          studentName: a.student.name,
          studentEmail: a.student.email,
          courseId: a.courseId,
          courseTitle: studentEnrollment ? studentEnrollment.course.title : 'Unknown Course',
          engagementScore: a.engagementScore,
          engagementBand: a.engagementBand,
          performanceCategory: a.performanceCategory,
          riskLevel: a.riskLevel,
          computedAt: a.computedAt
        };
      })
      .sort((a, b) => {
        // High Risk first
        if (a.riskLevel === 'High Risk' && b.riskLevel !== 'High Risk') return -1;
        if (a.riskLevel !== 'High Risk' && b.riskLevel === 'High Risk') return 1;
        return b.engagementScore - a.engagementScore; // Then by engagement score
      });

    // Total course and student stats
    const totalStudentsCount = enrolledStudentIds.length;

    return res.json({
      summary: {
        totalCourses: courses.length,
        totalStudents: totalStudentsCount,
        avgEngagementScore,
        atRiskCount: atRiskStudents.length
      },
      performanceDistribution: [
        { name: 'Distinction', count: distribution.Distinction },
        { name: 'Merit', count: distribution.Merit },
        { name: 'Pass', count: distribution.Pass },
        { name: 'At Risk / Fail', count: distribution['At Risk / Fail'] }
      ],
      atRiskStudents
    });
  } catch (error) {
    console.error('Error fetching instructor dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}

// 2. Course Builder - List
export async function getInstructorCourses(req, res) {
  const instructorId = req.user.id;

  try {
    const courses = await prisma.course.findMany({
      where: { instructorId },
      include: {
        modules: {
          orderBy: { order: 'asc' }
        },
        assessments: {
          include: {
            questions: true
          }
        }
      }
    });

    return res.json(courses);
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
}

// 3. Course Builder - Create
export async function createCourse(req, res) {
  const instructorId = req.user.id;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        instructorId,
        status: 'PENDING' // Needs Admin approval
      }
    });

    return res.status(201).json({ message: 'Course created successfully, pending approval.', course });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ error: 'Failed to create course' });
  }
}

// 4. Course Builder - Edit / Add Modules
export async function editCourse(req, res) {
  const instructorId = req.user.id;
  const { id } = req.params;
  const { title, description, modules } = req.body; // modules is an array of { id, title, order, type, contentUrl }

  try {
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course || course.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Access denied. You do not own this course.' });
    }

    // Update course basic info
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        title: title || course.title,
        description: description || course.description
      }
    });

    // If modules are provided, sync them
    if (modules && Array.isArray(modules)) {
      // 1. Delete modules not in the incoming list (those with IDs)
      const incomingModuleIds = modules.filter(m => m.id).map(m => m.id);
      await prisma.module.deleteMany({
        where: {
          courseId: id,
          id: { notIn: incomingModuleIds }
        }
      });

      // 2. Insert or update modules
      for (const mod of modules) {
        if (mod.id) {
          await prisma.module.update({
            where: { id: mod.id },
            data: {
              title: mod.title,
              order: mod.order,
              type: mod.type,
              contentUrl: mod.contentUrl
            }
          });
        } else {
          await prisma.module.create({
            data: {
              courseId: id,
              title: mod.title,
              order: mod.order,
              type: mod.type,
              contentUrl: mod.contentUrl
            }
          });
        }
      }
    }

    const finalCourse = await prisma.course.findUnique({
      where: { id },
      include: { modules: { orderBy: { order: 'asc' } } }
    });

    return res.json({ message: 'Course updated successfully', course: finalCourse });
  } catch (error) {
    console.error('Error editing course:', error);
    return res.status(500).json({ error: 'Failed to update course' });
  }
}

// 5. Assessment Builder - Create
export async function createAssessment(req, res) {
  const instructorId = req.user.id;
  const { courseId, title, type, maxScore, dueDate, questions } = req.body;

  if (!courseId || !title || !type || !dueDate) {
    return res.status(400).json({ error: 'CourseId, title, type, and dueDate are required' });
  }

  try {
    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Access denied. You do not own this course.' });
    }

    const assessment = await prisma.assessment.create({
      data: {
        courseId,
        title,
        type, // "quiz" or "assignment"
        maxScore: maxScore ? parseInt(maxScore) : 100,
        dueDate: new Date(dueDate)
      }
    });

    // If questions exist, create them
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        await prisma.question.create({
          data: {
            assessmentId: assessment.id,
            text: q.text,
            options: JSON.stringify(q.options || []), // Store as stringified array
            correctAnswer: q.correctAnswer || ""
          }
        });
      }
    }

    // Trigger recomputation of analytics for all students in this course (because a new assessment is added)
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId }
    });

    for (const en of enrollments) {
      await computeAnalytics(en.studentId, courseId);
    }

    return res.status(201).json({ message: 'Assessment created successfully', assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return res.status(500).json({ error: 'Failed to create assessment' });
  }
}

// 6. Analytics Dashboard - Student Drill Down
export async function getStudentAnalytics(req, res) {
  const instructorId = req.user.id;
  const { studentId } = req.params;
  const { courseId } = req.query; // optional filter, otherwise aggregate/list per course

  try {
    // Get courses taught by this instructor
    const instructorCourses = await prisma.course.findMany({
      where: { instructorId },
      select: { id: true, title: true }
    });

    const allowedCourseIds = instructorCourses.map(c => c.id);

    if (courseId && !allowedCourseIds.includes(courseId)) {
      return res.status(403).json({ error: 'Access denied. You do not teach this course.' });
    }

    // Fetch the target courses
    const targetCourseIds = courseId ? [courseId] : allowedCourseIds;

    // Student information
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Fetch analytics record(s) for the student
    const analyticsRecords = await prisma.analyticsRecord.findMany({
      where: {
        studentId,
        courseId: { in: targetCourseIds }
      }
    });

    // Fetch assessment history (submissions)
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        assessment: {
          courseId: { in: targetCourseIds }
        }
      },
      include: {
        assessment: {
          select: { title: true, type: true, maxScore: true, courseId: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Fetch student engagement timeline (recent activities)
    const activities = await prisma.activity.findMany({
      where: {
        userId: studentId,
        courseId: { in: targetCourseIds }
      },
      include: {
        course: {
          select: { title: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    // Fetch all enrollments of the student for the target courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId,
        courseId: { in: targetCourseIds }
      },
      include: {
        course: {
          include: {
            modules: true
          }
        }
      }
    });

    const coursesFormatted = enrollments.map(e => ({
      id: e.id,
      completionProgress: e.completionStatus,
      course: {
        id: e.course.id,
        title: e.course.title,
        modules: e.course.modules
      }
    }));

    // Calculate/format detailed analytics
    // 1. loginActivitiesCount (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const loginActivitiesCount = await prisma.activity.count({
      where: {
        userId: studentId,
        type: 'login',
        timestamp: { gte: thirtyDaysAgo }
      }
    });

    // 2. timeOnPlatform (last 30 days)
    const timeActivities = await prisma.activity.findMany({
      where: {
        userId: studentId,
        timestamp: { gte: thirtyDaysAgo }
      },
      select: { duration: true }
    });
    const totalDurationMinutes = timeActivities.reduce((sum, act) => sum + act.duration, 0);

    // 3. contentAccessCount
    const contentAccessCount = await prisma.activity.count({
      where: {
        userId: studentId,
        type: 'content_access',
        courseId: { in: targetCourseIds }
      }
    });

    // 4. forumParticipation
    const forumPostsCount = await prisma.forumPost.count({
      where: {
        courseId: { in: targetCourseIds },
        userId: studentId
      }
    });

    // 5. performanceTrend
    let performanceTrendSlope = 0;
    if (submissions.length >= 2) {
      const N = submissions.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      submissions.forEach((sub, idx) => {
        const x = idx;
        const y = sub.assessment.maxScore > 0 ? (sub.score / sub.assessment.maxScore) * 100 : 0;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      });
      const denominator = (N * sumXX) - (sumX * sumX);
      if (denominator !== 0) {
        performanceTrendSlope = ((N * sumXY) - (sumX * sumY)) / denominator;
      }
    }

    // 6. triggers
    const triggers = [];
    const isLoginFreqLow = loginActivitiesCount < 3;
    const avgScorePercent = submissions.length > 0
      ? (submissions.reduce((sum, s) => sum + s.score, 0) / submissions.reduce((sum, s) => sum + s.assessment.maxScore, 0)) * 100
      : 0;
    const isAverageScoreLow = submissions.length > 0 && avgScorePercent < 50;

    const latestRecord = analyticsRecords[0];
    const isEngagementLow = latestRecord ? latestRecord.engagementScore < 0.40 : true;

    const latestActivity = await prisma.activity.findFirst({
      where: { userId: studentId },
      orderBy: { timestamp: 'desc' }
    });
    let isInactivityHigh = false;
    if (latestActivity) {
      const daysSinceLatest = (new Date().getTime() - new Date(latestActivity.timestamp).getTime()) / (1000 * 3600 * 24);
      if (daysSinceLatest > 5) isInactivityHigh = true;
    } else {
      isInactivityHigh = true;
    }

    if (isLoginFreqLow) triggers.push('Low login frequency (less than 3 logins in 30 days)');
    if (isAverageScoreLow) triggers.push('Average assessment score below 50%');
    if (isEngagementLow) triggers.push('Low engagement score (below 40%)');
    if (isInactivityHigh) triggers.push('Inactivity for more than 5 consecutive days');

    const analyticsFormatted = [{
      riskLevel: latestRecord ? latestRecord.riskLevel : 'Low Risk',
      engagementScore: latestRecord ? latestRecord.engagementScore : 0,
      performanceTrend: performanceTrendSlope,
      loginFrequency: loginActivitiesCount,
      engagementBand: latestRecord ? latestRecord.engagementBand : 'Low',
      timeOnPlatform: totalDurationMinutes,
      contentAccessCount,
      forumParticipation: forumPostsCount,
      triggers
    }];

    return res.json({
      student,
      analytics: analyticsFormatted,
      courses: coursesFormatted,
      timeline: activities
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch student drill-down analytics' });
  }
}

// 7. Notifications/Alarms panel
export async function getRiskAlerts(req, res) {
  const instructorId = req.user.id;

  try {
    const courses = await prisma.course.findMany({
      where: { instructorId }
    });

    const courseIds = courses.map(c => c.id);

    // Fetch student analytics records that flag High Risk or Moderate Risk
    const records = await prisma.analyticsRecord.findMany({
      where: {
        courseId: { in: courseIds },
        riskLevel: { in: ['High Risk', 'Moderate Risk'] }
      },
      include: {
        student: {
          select: { name: true, email: true }
        }
      },
      orderBy: { computedAt: 'desc' }
    });

    const alerts = records.map(r => {
      const course = courses.find(c => c.id === r.courseId);
      return {
        id: r.id,
        studentId: r.studentId,
        studentName: r.student.name,
        studentEmail: r.student.email,
        courseId: r.courseId,
        courseTitle: course ? course.title : 'Unknown Course',
        riskLevel: r.riskLevel,
        engagementBand: r.engagementBand,
        performanceCategory: r.performanceCategory,
        message: `Student ${r.student.name} has crossed the at-risk threshold (${r.riskLevel}) in course "${course ? course.title : ''}".`,
        timestamp: r.computedAt
      };
    });

    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

// 8. Action triggering - Send Message / Schedule Support / Adjust Content
export async function triggerInterventionAction(req, res) {
  const instructorId = req.user.id;
  const { action, studentId, courseId, notes } = req.body;

  if (!action || !studentId || !courseId) {
    return res.status(400).json({ error: 'Action, studentId, and courseId are required' });
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let resultMsg = '';
    let defaultContent = '';
    if (action === 'Send Message') {
      resultMsg = `Automated supportive message sent to student ${student.name} with study suggestions.`;
      defaultContent = `Hi ${student.name}, I noticed some risk factors in your analytics trend. Please let me know if you need any help with the course content or if you want to discuss study strategies.`;
    } else if (action === 'Schedule Support') {
      resultMsg = `Support meeting invitation scheduled and sent to student ${student.name}.`;
      defaultContent = `Hi ${student.name}, I would like to schedule a support meeting with you to discuss your progress and how we can support you. Please let me know your availability.`;
    } else if (action === 'Adjust Content') {
      resultMsg = `Study content adjustments recommended and flagged in student portal for ${student.name}.`;
      defaultContent = `Adjustments to your study path have been recommended. Please check the recommended modules or discussion boards.`;
    } else {
      resultMsg = `Intervention action "${action}" successfully executed for student ${student.name}.`;
      defaultContent = `Intervention flagged: ${action}`;
    }

    // Save message/intervention to database
    await prisma.message.create({
      data: {
        senderId: instructorId,
        recipientId: studentId,
        courseId,
        type: action,
        content: notes || defaultContent,
        isRead: false
      }
    });

    return res.json({ message: resultMsg });
  } catch (error) {
    console.error('Error triggering intervention:', error);
    return res.status(500).json({ error: 'Failed to execute intervention action' });
  }
}

// 9. Add a Module
export async function addModule(req, res) {
  const instructorId = req.user.id;
  const { courseId } = req.params;
  const { title, type, contentUrl, order } = req.body;

  if (!title || !type || !contentUrl) {
    return res.status(400).json({ error: 'Title, type, and contentUrl are required' });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Access denied. You do not own this course.' });
    }

    const moduleItem = await prisma.module.create({
      data: {
        courseId,
        title,
        type: type.toLowerCase(),
        contentUrl,
        order: order ? parseInt(order) : 1
      }
    });

    return res.status(201).json({ message: 'Module added successfully', module: moduleItem });
  } catch (error) {
    console.error('Error adding module:', error);
    return res.status(500).json({ error: 'Failed to add module' });
  }
}

// 10. Delete a Module
export async function deleteModule(req, res) {
  const instructorId = req.user.id;
  const { courseId, moduleId } = req.params;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.instructorId !== instructorId) {
      return res.status(403).json({ error: 'Access denied. You do not own this course.' });
    }

    await prisma.module.delete({
      where: { id: moduleId }
    });

    return res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    console.error('Error deleting module:', error);
    return res.status(500).json({ error: 'Failed to delete module' });
  }
}
