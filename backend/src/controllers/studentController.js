import { PrismaClient } from '@prisma/client';
import { computeAnalytics } from '../services/analyticsEngine.js';

const prisma = new PrismaClient();

// 1. Student Dashboard
export async function getDashboard(req, res) {
  const studentId = req.user.id;

  try {
    // Enrolled courses with completion status and analytics
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            instructor: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Get analytics records for these courses
    const analytics = await prisma.analyticsRecord.findMany({
      where: { studentId }
    });

    const enrolledCourses = enrollments.map(en => {
      const courseAnalytics = analytics.find(an => an.courseId === en.courseId);
      return {
        id: en.course.id,
        title: en.course.title,
        description: en.course.description,
        instructorName: en.course.instructor.name,
        completionStatus: en.completionStatus,
        enrolledAt: en.enrolledAt,
        engagementScore: courseAnalytics ? courseAnalytics.engagementScore : 0,
        engagementBand: courseAnalytics ? courseAnalytics.engagementBand : 'Low',
        performanceCategory: courseAnalytics ? courseAnalytics.performanceCategory : 'Pass',
        riskLevel: courseAnalytics ? courseAnalytics.riskLevel : 'Low Risk'
      };
    });

    // Upcoming assessments (where due date is in the future, and student hasn't submitted yet)
    const courseIds = enrolledCourses.map(c => c.id);
    const submissions = await prisma.submission.findMany({
      where: { studentId },
      select: { assessmentId: true }
    });
    const submittedAssessmentIds = submissions.map(s => s.assessmentId);

    const upcomingAssessments = await prisma.assessment.findMany({
      where: {
        courseId: { in: courseIds },
        dueDate: { gte: new Date() },
        id: { notIn: submittedAssessmentIds }
      },
      include: {
        course: {
          select: { title: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Recent Activity
    const recentActivities = await prisma.activity.findMany({
      where: { userId: studentId },
      include: {
        course: {
          select: { title: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    // Performance Score Chart Data (Submissions over time)
    const studentSubmissions = await prisma.submission.findMany({
      where: { studentId },
      include: {
        assessment: {
          include: {
            course: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    const performanceChartData = studentSubmissions.map(sub => ({
      assessmentTitle: sub.assessment.title,
      courseTitle: sub.assessment.course.title,
      scorePercent: sub.assessment.maxScore > 0 ? (sub.score / sub.assessment.maxScore) * 100 : 0,
      submittedAt: sub.submittedAt
    }));

    // Overall metrics
    const avgEngagement = analytics.length > 0
      ? analytics.reduce((sum, r) => sum + r.engagementScore, 0) / analytics.length
      : 0;

    let overallRisk = 'Low Risk';
    if (analytics.some(r => r.riskLevel === 'High Risk')) {
      overallRisk = 'High Risk';
    } else if (analytics.some(r => r.riskLevel === 'Moderate Risk')) {
      overallRisk = 'Moderate Risk';
    }

    return res.json({
      enrolledCourses,
      upcomingAssessments,
      recentActivities,
      performanceChartData,
      summary: {
        avgEngagement,
        overallRisk,
        totalEnrolled: enrolledCourses.length
      }
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch student dashboard' });
  }
}

// 2. Course Catalog
export async function getCourses(req, res) {
  const studentId = req.user.id;

  try {
    const courses = await prisma.course.findMany({
      where: { status: 'APPROVED' },
      include: {
        instructor: {
          select: { name: true }
        },
        enrollments: {
          where: { studentId }
        }
      }
    });

    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      instructorName: course.instructor.name,
      createdAt: course.createdAt,
      isEnrolled: course.enrollments.length > 0,
      completionStatus: course.enrollments.length > 0 ? course.enrollments[0].completionStatus : 0
    }));

    return res.json(formattedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ error: 'Failed to fetch course catalog' });
  }
}

// 3. Enroll in a course
export async function enrollCourse(req, res) {
  const studentId = req.user.id;
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.status !== 'APPROVED') {
      return res.status(404).json({ error: 'Approved course not found' });
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'You are already enrolled in this course' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        completionStatus: 0.0
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: studentId,
        courseId,
        type: 'content_access',
        duration: 2 // Mock 2 minutes for enrollment
      }
    });

    // Run initial analytics
    await computeAnalytics(studentId, courseId);

    return res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    return res.status(500).json({ error: 'Failed to enroll in course' });
  }
}

// 4. Get course details and modules
export async function getCourseDetails(req, res) {
  const studentId = req.user.id;
  const { id } = req.params;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: id }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { name: true, email: true }
        },
        modules: {
          orderBy: { order: 'asc' }
        },
        assessments: {
          include: {
            submissions: {
              where: { studentId }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Log content access activity
    await prisma.activity.create({
      data: {
        userId: studentId,
        courseId: id,
        type: 'content_access',
        duration: 5 // Mock 5 minutes spent browsing course
      }
    });

    // Return course details
    return res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      modules: course.modules,
      assessments: course.assessments.map(ass => ({
        id: ass.id,
        title: ass.title,
        type: ass.type,
        maxScore: ass.maxScore,
        dueDate: ass.dueDate,
        isSubmitted: ass.submissions.length > 0,
        submission: ass.submissions.length > 0 ? ass.submissions[0] : null
      })),
      completionStatus: enrollment.completionStatus
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return res.status(500).json({ error: 'Failed to fetch course details' });
  }
}

// 5. Complete a module
export async function completeModule(req, res) {
  const studentId = req.user.id;
  const { courseId, moduleId } = req.params;

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Verify module exists
    const moduleItem = await prisma.module.findFirst({
      where: { id: moduleId, courseId }
    });

    if (!moduleItem) {
      return res.status(404).json({ error: 'Module not found in this course' });
    }

    // Log activity for accessing/completing module
    await prisma.activity.create({
      data: {
        userId: studentId,
        courseId,
        type: 'content_access',
        duration: 15 // Mock 15 minutes spent on the module content
      }
    });

    // Calculate new completion status
    // For a simple mock, we count how many modules have been accessed by activity
    const totalModulesCount = await prisma.module.count({
      where: { courseId }
    });

    const accessedModulesCount = await prisma.activity.groupBy({
      by: ['duration'], // Dummy group by since we want to find distinct type content_access
      where: {
        userId: studentId,
        courseId,
        type: 'content_access'
      }
    });

    // Better: let's update completionStatus by incrementing it, or recalculate based on accessed modules
    // Since we want to make it easy, let's increment the enrollment status.
    // Let's say each module adds equal percentage:
    const currentProgress = enrollment.completionStatus;
    const increment = totalModulesCount > 0 ? (100 / totalModulesCount) : 100;
    const newProgress = Math.min(currentProgress + increment, 100);

    await prisma.enrollment.update({
      where: {
        studentId_courseId: { studentId, courseId }
      },
      data: {
        completionStatus: newProgress
      }
    });

    // Recompute analytics
    await computeAnalytics(studentId, courseId);

    return res.json({ message: 'Module completed successfully', completionStatus: newProgress });
  } catch (error) {
    console.error('Error completing module:', error);
    return res.status(500).json({ error: 'Failed to record module completion' });
  }
}

// 6. Get assessment details (quiz questions, etc.)
export async function getAssessment(req, res) {
  const studentId = req.user.id;
  const { id } = req.params;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            text: true,
            options: true
            // omit correctAnswer from students!
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: assessment.course.id }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: { assessmentId: id, studentId }
    });

    return res.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        maxScore: assessment.maxScore,
        dueDate: assessment.dueDate,
        course: assessment.course,
        questions: assessment.questions.map(q => {
          let parsedOptions = [];
          try {
            parsedOptions = q.options ? JSON.parse(q.options) : [];
            if (!Array.isArray(parsedOptions)) parsedOptions = [];
          } catch (e) {
            console.error('Error parsing options for question', q.id, e);
          }
          return {
            id: q.id,
            text: q.text,
            options: parsedOptions
          };
        })
      },
      isSubmitted: !!existingSubmission,
      submission: existingSubmission
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return res.status(500).json({ error: 'Failed to fetch assessment details' });
  }
}

// 7. Submit assessment (Quiz / Assignment)
export async function submitAssessment(req, res) {
  const studentId = req.user.id;
  const { id } = req.params;
  const { answers, assignmentContent } = req.body; // answers is an object { questionId: selectedOption }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: true,
        course: true
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId: assessment.courseId }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: { assessmentId: id, studentId }
    });

    if (existingSubmission) {
      return res.status(400).json({ error: 'Assessment already submitted' });
    }

    let score = 0;
    let feedback = '';

    if (assessment.type === 'quiz') {
      // Auto grade quiz
      const totalQuestions = assessment.questions.length;
      let correctCount = 0;

      assessment.questions.forEach(q => {
        const studentAns = answers && answers[q.id];
        if (studentAns === q.correctAnswer) {
          correctCount++;
        }
      });

      const rawScorePercent = totalQuestions > 0 ? correctCount / totalQuestions : 0;
      score = rawScorePercent * assessment.maxScore;
      feedback = `Automated grading: Got ${correctCount} out of ${totalQuestions} questions correct.`;
    } else {
      // Assignment: Default dummy score or wait for grading. Let's assign a random/default score for demo and allow the instructor to edit it later.
      score = 80.0; // Mock score for initial submission of assignment
      feedback = 'Assignment submitted successfully. Pending instructor feedback.';
    }

    const submission = await prisma.submission.create({
      data: {
        assessmentId: id,
        studentId,
        score,
        feedback
      }
    });

    // Record submission activity
    await prisma.activity.create({
      data: {
        userId: studentId,
        courseId: assessment.courseId,
        type: 'assessment_submission',
        duration: 30 // Mock 30 minutes spent on the test
      }
    });

    // Recompute analytics
    await computeAnalytics(studentId, assessment.courseId);

    return res.status(201).json({
      message: 'Assessment submitted successfully',
      submission,
      score,
      maxScore: assessment.maxScore
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return res.status(500).json({ error: 'Failed to submit assessment' });
  }
}

// 8. Forum endpoints
export async function getForumPosts(req, res) {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    // Verify enrollment or instructor status
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } }
    });

    // Instructors and Admins can also view the forum, let's verify if user has access
    const isInstructor = req.user.role === 'INSTRUCTOR';
    const isAdmin = req.user.role === 'ADMIN';

    if (!enrollment && !isInstructor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const posts = await prisma.forumPost.findMany({
      where: { courseId },
      include: {
        user: {
          select: { name: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(posts);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return res.status(500).json({ error: 'Failed to fetch forum posts' });
  }
}

export async function createForumPost(req, res) {
  const { courseId } = req.params;
  const studentId = req.user.id;
  const { content, parentId } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } }
    });

    const isInstructor = req.user.role === 'INSTRUCTOR';
    const isAdmin = req.user.role === 'ADMIN';

    if (!enrollment && !isInstructor && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const post = await prisma.forumPost.create({
      data: {
        courseId,
        userId: studentId,
        content,
        parentId
      },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    // Log forum participation activity
    await prisma.activity.create({
      data: {
        userId: studentId,
        courseId,
        type: 'forum_participation',
        duration: 5 // Mock 5 minutes for post creation
      }
    });

    // Recompute analytics
    if (req.user.role === 'STUDENT') {
      await computeAnalytics(studentId, courseId);
    }

    return res.status(201).json(post);
  } catch (error) {
    console.error('Error creating forum post:', error);
    return res.status(500).json({ error: 'Failed to post message' });
  }
}

// 9. Get Profile / Engagement metrics
export async function getProfile(req, res) {
  const studentId = req.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Gather overall analytics across all enrolled courses
    const analytics = await prisma.analyticsRecord.findMany({
      where: { studentId },
      include: {
        student: {
          select: { name: true }
        }
      }
    });

    const submissions = await prisma.submission.findMany({
      where: { studentId }
    });

    const activitiesCount = await prisma.activity.count({
      where: { userId: studentId }
    });

    let overallEngagementScore = 0;
    let riskLevel = 'Low Risk';
    let performanceCategory = 'Pass';

    if (analytics.length > 0) {
      overallEngagementScore = analytics.reduce((sum, r) => sum + r.engagementScore, 0) / analytics.length;

      // Peak risk level
      if (analytics.some(r => r.riskLevel === 'High Risk')) {
        riskLevel = 'High Risk';
      } else if (analytics.some(r => r.riskLevel === 'Moderate Risk')) {
        riskLevel = 'Moderate Risk';
      }

      // Most severe category
      if (analytics.some(r => r.performanceCategory === 'At Risk / Fail')) {
        performanceCategory = 'At Risk / Fail';
      } else if (analytics.some(r => r.performanceCategory === 'Pass')) {
        performanceCategory = 'Pass';
      } else if (analytics.some(r => r.performanceCategory === 'Merit')) {
        performanceCategory = 'Merit';
      } else if (analytics.some(r => r.performanceCategory === 'Distinction')) {
        performanceCategory = 'Distinction';
      }
    }

    return res.json({
      user,
      analyticsSummary: {
        engagementScore: overallEngagementScore,
        riskLevel,
        performanceCategory,
        totalSubmissions: submissions.length,
        totalActivities: activitiesCount
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

// 10. Fetch student direct intervention messages
export async function getStudentMessages(req, res) {
  const studentId = req.user.id;
  try {
    const messages = await prisma.message.findMany({
      where: { recipientId: studentId },
      include: {
        sender: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(messages);
  } catch (error) {
    console.error('Error fetching student messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

// 11. Mark message as read
export async function markMessageAsRead(req, res) {
  const studentId = req.user.id;
  const { id } = req.params;
  try {
    const message = await prisma.message.findUnique({
      where: { id }
    });
    if (!message || message.recipientId !== studentId) {
      return res.status(404).json({ error: 'Message not found' });
    }
    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error marking message as read:', error);
    return res.status(500).json({ error: 'Failed to update message' });
  }
}
