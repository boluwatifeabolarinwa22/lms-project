import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Computes the analytics for a student in a course and saves/updates the record.
 * @param {string} studentId
 * @param {string} courseId
 */
export async function computeAnalytics(studentId, courseId) {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId }
      }
    });

    if (!enrollment) {
      console.warn(`No enrollment found for student ${studentId} in course ${courseId}`);
      return null;
    }

    // 1. Calculate Login Frequency (Logins in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const loginActivitiesCount = await prisma.activity.count({
      where: {
        userId: studentId,
        type: 'login',
        timestamp: { gte: thirtyDaysAgo }
      }
    });

    // Target: 15 logins per month
    const loginFrequencyMetric = Math.min(loginActivitiesCount / 15.0, 1.0);

    // 2. Calculate Time on Platform (in minutes, last 30 days)
    const timeActivities = await prisma.activity.findMany({
      where: {
        userId: studentId,
        timestamp: { gte: thirtyDaysAgo }
      },
      select: {
        duration: true
      }
    });

    const totalDurationMinutes = timeActivities.reduce((sum, act) => sum + act.duration, 0);
    // Target: 600 minutes (10 hours) per month
    const timeOnPlatformMetric = Math.min(totalDurationMinutes / 600.0, 1.0);

    // 3. Content Access Rate (modules completed)
    // Content Access Rate = completionStatus / 100.0
    const contentAccessRateMetric = enrollment.completionStatus / 100.0;

    // 4. Forum Participation (Posts in this course)
    const forumPostsCount = await prisma.forumPost.count({
      where: {
        courseId,
        userId: studentId
      }
    });
    // Target: 10 posts
    const forumParticipationMetric = Math.min(forumPostsCount / 10.0, 1.0);

    // 5. Assignment Submission Rate
    // Get total assessments for the course
    const totalAssessments = await prisma.assessment.count({
      where: { courseId }
    });

    // Get submissions by student for these assessments
    const studentSubmissionsCount = await prisma.submission.count({
      where: {
        studentId,
        assessment: { courseId }
      }
    });

    const assignmentSubmissionRateMetric = totalAssessments > 0 
      ? studentSubmissionsCount / totalAssessments 
      : 1.0; // If no assessments, default to 1.0

    // Compute Engagement Score (ES)
    // ES = (0.25 * Login_Frequency) + (0.25 * Time_on_Platform) + (0.20 * Content_Access_Rate) + (0.15 * Forum_Participation) + (0.15 * Assignment_Submission_Rate)
    const engagementScore = 
      (0.25 * loginFrequencyMetric) + 
      (0.25 * timeOnPlatformMetric) + 
      (0.20 * contentAccessRateMetric) + 
      (0.15 * forumParticipationMetric) + 
      (0.15 * assignmentSubmissionRateMetric);

    // Band classification
    let engagementBand = 'Low';
    if (engagementScore >= 0.75) {
      engagementBand = 'High';
    } else if (engagementScore >= 0.40) {
      engagementBand = 'Medium';
    }

    // 6. Performance Trend & Average Score
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        assessment: { courseId }
      },
      orderBy: {
        submittedAt: 'asc'
      },
      include: {
        assessment: true
      }
    });

    let averageScorePercent = 0;
    let performanceTrendSlope = 0;
    let performanceCategory = 'Pass';

    if (submissions.length > 0) {
      let totalMaxScore = 0;
      let totalEarnedScore = 0;

      submissions.forEach(sub => {
        totalEarnedScore += sub.score;
        totalMaxScore += sub.assessment.maxScore;
      });

      averageScorePercent = totalMaxScore > 0 ? (totalEarnedScore / totalMaxScore) * 100 : 0;

      // Classify performance
      if (averageScorePercent >= 70) {
        performanceCategory = 'Distinction';
      } else if (averageScorePercent >= 60) {
        performanceCategory = 'Merit';
      } else if (averageScorePercent >= 45) {
        performanceCategory = 'Pass';
      } else {
        performanceCategory = 'At Risk / Fail';
      }

      // Linear Regression for Performance Trend
      if (submissions.length >= 2) {
        const N = submissions.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        submissions.forEach((sub, idx) => {
          const x = idx; // 0-based index as a time representative
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
    } else {
      // If no submissions, category defaults to At Risk / Fail or Pass based on content access or flat 0. Let's start with Fail/At Risk if no progress
      performanceCategory = 'At Risk / Fail';
    }

    // 7. At-Risk Detection
    // Flag a student as at-risk if 2 or more of these are true:
    // - Login frequency below threshold (e.g. < 3 logins in 30 days)
    // - Average assessment score below 50%
    // - Engagement score in Low band (< 0.40)
    // - More than 5 consecutive days of inactivity

    // Risk indicator 1: Low login frequency
    const isLoginFreqLow = loginActivitiesCount < 3;

    // Risk indicator 2: Average assessment score < 50%
    const isAverageScoreLow = submissions.length > 0 && averageScorePercent < 50;

    // Risk indicator 3: Engagement score in Low band (< 0.40)
    const isEngagementLow = engagementScore < 0.40;

    // Risk indicator 4: Inactivity for more than 5 consecutive days
    const latestActivity = await prisma.activity.findFirst({
      where: { userId: studentId },
      orderBy: { timestamp: 'desc' }
    });

    let isInactivityHigh = false;
    if (latestActivity) {
      const daysSinceLatest = (new Date().getTime() - new Date(latestActivity.timestamp).getTime()) / (1000 * 3600 * 24);
      if (daysSinceLatest > 5) {
        isInactivityHigh = true;
      }
    } else {
      // If there are no activities at all, mark as inactive
      isInactivityHigh = true;
    }

    // Sum up the indicators
    let riskCount = 0;
    if (isLoginFreqLow) riskCount++;
    if (isAverageScoreLow) riskCount++;
    if (isEngagementLow) riskCount++;
    if (isInactivityHigh) riskCount++;

    const isAtRisk = riskCount >= 2;

    // Classify overall Risk Level
    let riskLevel = 'Low Risk';
    if (isAtRisk) {
      if (averageScorePercent < 45 || engagementScore < 0.40) {
        riskLevel = 'High Risk';
      } else {
        riskLevel = 'Moderate Risk';
      }
    } else if (riskCount === 1) {
      riskLevel = 'Moderate Risk';
    }

    // Upsert the AnalyticsRecord
    const record = await prisma.analyticsRecord.upsert({
      where: {
        studentId_courseId: { studentId, courseId }
      },
      update: {
        engagementScore,
        engagementBand,
        performanceCategory,
        riskLevel,
        computedAt: new Date()
      },
      create: {
        studentId,
        courseId,
        engagementScore,
        engagementBand,
        performanceCategory,
        riskLevel,
        computedAt: new Date()
      }
    });

    // Check if we need to trigger a notification alert for Instructor
    // Alerts are stored in memory or checked dynamically, let's create a notification model or trigger dynamic alerts in the dashboard.
    // In our system, the notification panel will fetch at-risk records, which are computed instantly!

    return record;
  } catch (error) {
    console.error('Error computing analytics:', error);
    throw error;
  }
}

/**
 * Recomputes analytics for all enrollments of a student.
 * Useful when logging in.
 * @param {string} studentId
 */
export async function computeAllAnalyticsForStudent(studentId) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId }
    });

    const results = [];
    for (const enrollment of enrollments) {
      const record = await computeAnalytics(studentId, enrollment.courseId);
      if (record) results.push(record);
    }
    return results;
  } catch (error) {
    console.error(`Error computing all analytics for student ${studentId}:`, error);
  }
}
