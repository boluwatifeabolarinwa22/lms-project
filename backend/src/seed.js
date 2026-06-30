import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computeAnalytics } from './services/analyticsEngine.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.analyticsRecord.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.module.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing tables.');

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@lms.com',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  const instructor1 = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Jenkins',
      email: 'jenkins@lms.com',
      password: passwordHash,
      role: 'INSTRUCTOR'
    }
  });

  const instructor2 = await prisma.user.create({
    data: {
      name: 'Prof. David Miller',
      email: 'miller@lms.com',
      password: passwordHash,
      role: 'INSTRUCTOR'
    }
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Alice Cooper (Distinction Student)',
      email: 'alice@lms.com',
      password: passwordHash,
      role: 'STUDENT',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days ago
    }
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Bob Marley (Merit Student)',
      email: 'bob@lms.com',
      password: passwordHash,
      role: 'STUDENT',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Charlie Brown (At Risk Student)',
      email: 'charlie@lms.com',
      password: passwordHash,
      role: 'STUDENT',
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
    }
  });

  console.log('Users created.');

  // Create Courses
  const course1 = await prisma.course.create({
    data: {
      title: 'Advanced Web Engineering with React',
      description: 'Master component-driven design, state management with Redux/Context, and custom hook architectures in React.',
      instructorId: instructor1.id,
      status: 'APPROVED'
    }
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'Machine Learning Fundamentals',
      description: 'Introduction to supervised and unsupervised algorithms, neural networks, and linear regression models.',
      instructorId: instructor1.id,
      status: 'APPROVED'
    }
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'Database Management Systems',
      description: 'Design relational database architectures, master SQL queries, indexes, normalization, and ORM abstractions.',
      instructorId: instructor2.id,
      status: 'APPROVED'
    }
  });

  const course4 = await prisma.course.create({
    data: {
      title: 'Cybersecurity Policies and Operations',
      description: 'Learn framework defense systems, network security configurations, and protocol standards.',
      instructorId: instructor2.id,
      status: 'PENDING' // Awaiting Admin Approval
    }
  });

  console.log('Courses created.');

  // Create Modules for Course 1
  const modulesC1 = [
    { title: 'Introduction to React & Component Architecture', order: 1, type: 'doc', contentUrl: 'https://react.dev/learn' },
    { title: 'Deep Dive: State and Hooks Lifecycle', order: 2, type: 'video', contentUrl: 'https://www.youtube.com/watch?v=LlvBzyy-558' },
    { title: 'Reusing Logic with Custom React Hooks', order: 3, type: 'link', contentUrl: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
    { title: 'Context API and State Managers', order: 4, type: 'doc', contentUrl: 'https://react.dev/reference/react/useContext' }
  ];

  for (const mod of modulesC1) {
    await prisma.module.create({
      data: { courseId: course1.id, ...mod }
    });
  }

  // Create Modules for Course 2
  const modulesC2 = [
    { title: 'Introduction to Machine Learning & Core Concepts', order: 1, type: 'doc', contentUrl: 'https://en.wikipedia.org/wiki/Machine_learning' },
    { title: 'Linear Regression & Gradient Descent Explained', order: 2, type: 'video', contentUrl: 'https://www.youtube.com/watch?v=sDv4f4s2SB8' },
    { title: 'Decision Trees & Classification Algorithms', order: 3, type: 'doc', contentUrl: 'https://scikit-learn.org/stable/supervised_learning.html' },
    { title: 'Clustering & Unsupervised Learning Methods', order: 4, type: 'link', contentUrl: 'https://scikit-learn.org/stable/modules/clustering.html' }
  ];

  for (const mod of modulesC2) {
    await prisma.module.create({
      data: { courseId: course2.id, ...mod }
    });
  }

  // Create Modules for Course 3
  const modulesC3 = [
    { title: 'Relational Model & Schema Design', order: 1, type: 'doc', contentUrl: 'https://en.wikipedia.org/wiki/Relational_database' },
    { title: 'SQL Basics: Queries & Joins', order: 2, type: 'video', contentUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' },
    { title: 'Indexes & Query Optimization', order: 3, type: 'doc', contentUrl: 'https://www.postgresql.org/docs/' },
    { title: 'Database Normalization (1NF to BCNF)', order: 4, type: 'link', contentUrl: 'https://en.wikipedia.org/wiki/Database_normalization' }
  ];

  for (const mod of modulesC3) {
    await prisma.module.create({
      data: { courseId: course3.id, ...mod }
    });
  }

  // Create Modules for Course 4
  const modulesC4 = [
    { title: 'Cybersecurity Frameworks & Standards', order: 1, type: 'doc', contentUrl: 'https://www.nist.gov/cyberframework' },
    { title: 'Network Security & Firewalls', order: 2, type: 'video', contentUrl: 'https://www.youtube.com/watch?v=y3nEplVl3y4' },
    { title: 'Encryption & Cryptography Basics', order: 3, type: 'doc', contentUrl: 'https://en.wikipedia.org/wiki/Cryptography' },
    { title: 'Risk Management & Incident Response Policies', order: 4, type: 'link', contentUrl: 'https://www.cisa.gov/resources-tools' }
  ];

  for (const mod of modulesC4) {
    await prisma.module.create({
      data: { courseId: course4.id, ...mod }
    });
  }

  console.log('Modules created for all courses.');

  // Create Enrollments
  await prisma.enrollment.create({
    data: { studentId: student1.id, courseId: course1.id, completionStatus: 100.0 } // 100% completed
  });
  await prisma.enrollment.create({
    data: { studentId: student1.id, courseId: course2.id, completionStatus: 50.0 }
  });
  await prisma.enrollment.create({
    data: { studentId: student1.id, courseId: course3.id, completionStatus: 0.0 }
  });

  await prisma.enrollment.create({
    data: { studentId: student2.id, courseId: course1.id, completionStatus: 75.0 } // 75% completed
  });
  await prisma.enrollment.create({
    data: { studentId: student2.id, courseId: course2.id, completionStatus: 25.0 }
  });
  await prisma.enrollment.create({
    data: { studentId: student2.id, courseId: course3.id, completionStatus: 50.0 }
  });

  await prisma.enrollment.create({
    data: { studentId: student3.id, courseId: course1.id, completionStatus: 25.0 } // 25% completed
  });
  await prisma.enrollment.create({
    data: { studentId: student3.id, courseId: course2.id, completionStatus: 0.0 }
  });
  await prisma.enrollment.create({
    data: { studentId: student3.id, courseId: course3.id, completionStatus: 10.0 }
  });

  console.log('Enrollments created.');

  // Create Assessments
  const quiz1 = await prisma.assessment.create({
    data: {
      courseId: course1.id,
      title: 'React Core Concept Quiz',
      type: 'quiz',
      maxScore: 100,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    }
  });

  const assignment1 = await prisma.assessment.create({
    data: {
      courseId: course1.id,
      title: 'Assignment 1: Portfolio Dashboard Integration',
      type: 'assignment',
      maxScore: 100,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  });

  const quiz2 = await prisma.assessment.create({
    data: {
      courseId: course2.id,
      title: 'Linear Regression and Math Quiz',
      type: 'quiz',
      maxScore: 100,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
    }
  });

  const assignment2 = await prisma.assessment.create({
    data: {
      courseId: course2.id,
      title: 'Assignment 2: Implement Gradient Descent in Python',
      type: 'assignment',
      maxScore: 100,
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
    }
  });

  const quiz3 = await prisma.assessment.create({
    data: {
      courseId: course3.id,
      title: 'SQL & Relational Algebra Quiz',
      type: 'quiz',
      maxScore: 100,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    }
  });

  const assignment3 = await prisma.assessment.create({
    data: {
      courseId: course3.id,
      title: 'Assignment 3: E-Commerce Database Schema Design',
      type: 'assignment',
      maxScore: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  const quiz4 = await prisma.assessment.create({
    data: {
      courseId: course4.id,
      title: 'Cybersecurity Policies Quiz',
      type: 'quiz',
      maxScore: 100,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Assessments created.');

  // Quiz Questions for Course 1
  await prisma.question.create({
    data: {
      assessmentId: quiz1.id,
      text: 'Which React Hook handles side-effects like data fetching or DOM subscriptions?',
      options: JSON.stringify(['useState', 'useEffect', 'useMemo', 'useRef']),
      correctAnswer: 'useEffect'
    }
  });

  await prisma.question.create({
    data: {
      assessmentId: quiz1.id,
      text: 'What is the correct syntax for declaring state in a functional component?',
      options: JSON.stringify([
        'const [state, setState] = useState(initial)',
        'const state = useState(initial)',
        'const {state, setState} = useState(initial)',
        'let state = new State(initial)'
      ]),
      correctAnswer: 'const [state, setState] = useState(initial)'
    }
  });

  // Quiz Questions for Course 2
  await prisma.question.create({
    data: {
      assessmentId: quiz2.id,
      text: 'What is the primary goal of Supervised Learning?',
      options: JSON.stringify([
        'To group data points without labels',
        'To predict labeled output from given inputs',
        'To optimize behavior based on random rewards',
        'To compress high-dimensional features'
      ]),
      correctAnswer: 'To predict labeled output from given inputs'
    }
  });

  await prisma.question.create({
    data: {
      assessmentId: quiz2.id,
      text: 'Which cost function is commonly used for Linear Regression?',
      options: JSON.stringify([
        'Mean Squared Error (MSE)',
        'Cross-Entropy Loss',
        'Hinge Loss',
        'Kullback-Leibler Divergence'
      ]),
      correctAnswer: 'Mean Squared Error (MSE)'
    }
  });

  // Quiz Questions for Course 3
  await prisma.question.create({
    data: {
      assessmentId: quiz3.id,
      text: 'Which SQL keyword is used to retrieve distinct values?',
      options: JSON.stringify(['UNIQUE', 'DISTINCT', 'DIFFERENT', 'GROUP BY']),
      correctAnswer: 'DISTINCT'
    }
  });

  await prisma.question.create({
    data: {
      assessmentId: quiz3.id,
      text: 'Which normal form focuses on removing transitive functional dependencies?',
      options: JSON.stringify(['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)']),
      correctAnswer: 'Third Normal Form (3NF)'
    }
  });

  console.log('Quiz questions created.');

  // Create Submissions
  // Student 1 (Alice): High engagement, Distinction scores
  await prisma.submission.create({
    data: { assessmentId: quiz1.id, studentId: student1.id, score: 100.0, feedback: 'Perfect score! Excellent understanding of React core hooks.' }
  });
  await prisma.submission.create({
    data: { assessmentId: assignment1.id, studentId: student1.id, score: 95.0, feedback: 'Stunning design and robust state management implementation.' }
  });
  await prisma.submission.create({
    data: { assessmentId: quiz2.id, studentId: student1.id, score: 90.0, feedback: 'Great job on the math and linear regression theory!' }
  });

  // Student 2 (Bob): Medium engagement, Merit scores
  await prisma.submission.create({
    data: { assessmentId: quiz1.id, studentId: student2.id, score: 75.0, feedback: 'Well done. Review question 2 for state syntax details.' }
  });
  await prisma.submission.create({
    data: { assessmentId: assignment1.id, studentId: student2.id, score: 62.0, feedback: 'Solid design, but some interactive links do not work properly.' }
  });
  await prisma.submission.create({
    data: { assessmentId: quiz3.id, studentId: student2.id, score: 85.0, feedback: 'Excellent grasp of database queries!' }
  });

  // Student 3 (Charlie): Low engagement, At Risk/Fail scores
  await prisma.submission.create({
    data: { assessmentId: quiz1.id, studentId: student3.id, score: 35.0, feedback: 'Needs improvement. Please review modules 1 and 2.' }
  });
  await prisma.submission.create({
    data: { assessmentId: assignment1.id, studentId: student3.id, score: 40.0, feedback: 'Incomplete submission. Setup files are missing.' }
  });

  console.log('Submissions created.');

  // Create Activities
  // Student 1: High Engagement
  for (let i = 0; i < 18; i++) {
    await prisma.activity.create({
      data: {
        userId: student1.id,
        courseId: course1.id,
        type: 'login',
        timestamp: new Date(Date.now() - i * 1.5 * 24 * 60 * 60 * 1000),
        duration: 35
      }
    });
  }
  for (let i = 0; i < 5; i++) {
    await prisma.activity.create({
      data: {
        userId: student1.id,
        courseId: course2.id,
        type: 'content_access',
        timestamp: new Date(Date.now() - i * 4 * 24 * 60 * 60 * 1000),
        duration: 20
      }
    });
  }

  // Student 2: Moderate Engagement
  for (let i = 0; i < 7; i++) {
    await prisma.activity.create({
      data: {
        userId: student2.id,
        courseId: course1.id,
        type: 'login',
        timestamp: new Date(Date.now() - i * 4 * 24 * 60 * 60 * 1000),
        duration: 20
      }
    });
  }
  for (let i = 0; i < 4; i++) {
    await prisma.activity.create({
      data: {
        userId: student2.id,
        courseId: course3.id,
        type: 'content_access',
        timestamp: new Date(Date.now() - i * 5 * 24 * 60 * 60 * 1000),
        duration: 15
      }
    });
  }

  // Student 3: Low Engagement ( Charlie )
  await prisma.activity.create({
    data: {
      userId: student3.id,
      courseId: course1.id,
      type: 'login',
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      duration: 5
    }
  });

  console.log('Activities created.');

  // Forum posts
  await prisma.forumPost.create({
    data: {
      courseId: course1.id,
      userId: instructor1.id,
      content: 'Welcome everyone to Advanced Web Engineering! Use this forum to ask questions, share resources, and collaborate.'
    }
  });

  const post1 = await prisma.forumPost.create({
    data: {
      courseId: course1.id,
      userId: student1.id,
      content: 'Hello Dr. Jenkins, for Assignment 1, are we allowed to use the Context API for state management instead of Redux?'
    }
  });

  await prisma.forumPost.create({
    data: {
      courseId: course1.id,
      userId: instructor1.id,
      content: 'Absolutely, Alice. The Context API is perfect for this scope. Redux is optional.',
      parentId: post1.id
    }
  });

  console.log('Forum posts created.');

  // Recompute analytics for all students in all enrolled courses
  console.log('Computing analytics records...');
  await computeAnalytics(student1.id, course1.id);
  await computeAnalytics(student1.id, course2.id);
  await computeAnalytics(student1.id, course3.id);
  await computeAnalytics(student2.id, course1.id);
  await computeAnalytics(student2.id, course2.id);
  await computeAnalytics(student2.id, course3.id);
  await computeAnalytics(student3.id, course1.id);
  await computeAnalytics(student3.id, course2.id);
  await computeAnalytics(student3.id, course3.id);

  console.log('Database seeding successfully completed.');
}

main()
  .catch(e => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
