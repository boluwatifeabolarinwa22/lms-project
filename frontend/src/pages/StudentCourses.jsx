import React, { useState } from 'react';
import { Search, BookOpen, User, CheckCircle, PlusCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function StudentCourses({ courses = [], onEnroll, onNavigate, onSelectCourse }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (courses && courses.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Catalog Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{courses.error}</p>
          <button onClick={() => onNavigate('student/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const safeCourses = Array.isArray(courses) ? courses : [];

  const filteredCourses = safeCourses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Course Catalog</h1>
        <p className="text-slate-500 text-sm">Browse academic courses and enroll to start your learning journey.</p>
      </div>

      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by course title, description, or instructor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm shadow-sm"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          No courses found matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="rounded-2xl glass p-6 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md">
              <div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 w-fit mb-4 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">{course.title}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{course.instructorName}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 mb-6 leading-relaxed">{course.description}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                {course.isEnrolled ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span>Enrolled ({course.completionStatus.toFixed(0)}%)</span>
                    </div>
                    <button onClick={() => { onSelectCourse(course.id); onNavigate(`student/course/${course.id}`); }} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      <span>Study</span><ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => onEnroll(course.id)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm">
                    <PlusCircle className="w-4 h-4" /><span>Enroll Now</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
