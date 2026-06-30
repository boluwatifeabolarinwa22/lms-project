import React from 'react';
import { ArrowLeft, Play, FileText, ExternalLink, CheckCircle, Circle, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function StudentCourseDetails({ course, onCompleteModule, onNavigate, onSelectAssessment }) {
  if (!course) return <div className="text-center py-12 text-slate-500">Loading course...</div>;

  if (course.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Course Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{course.error}</p>
          <button onClick={() => onNavigate('student/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { id, title, description, instructor = {}, modules = [], assessments = [], completionStatus = 0 } = course;
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getModuleIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'video': return <Play className="w-5 h-5 text-indigo-500" />;
      case 'doc': return <FileText className="w-5 h-5 text-sky-500" />;
      case 'link': default: return <ExternalLink className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      <button onClick={() => onNavigate('student/dashboard')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
      </button>

      <div className="p-6 rounded-2xl glass-premium border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-600 text-sm mb-4 max-w-2xl leading-relaxed">{description}</p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-blue-600 border border-slate-200">
              {instructor.name ? instructor.name[0] : 'I'}
            </div>
            <span className="text-xs text-slate-500 font-medium">Instructor: {instructor.name} ({instructor.email})</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-200 text-center min-w-[140px] shrink-0">
          <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider mb-1">Your Progress</span>
          <span className="text-3xl font-black text-blue-600 block mb-1">{completionStatus.toFixed(0)}%</span>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${completionStatus}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-2xl glass p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-600 text-xs font-bold">1</span>
              <span>Learning Modules</span>
            </h2>
            {modules.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No learning modules uploaded yet.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {modules.map((mod, idx) => {
                  const isCompleted = completionStatus >= (((idx + 1) / modules.length) * 100) - 0.01;
                  return (
                    <div key={mod.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${isCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`}>
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">{getModuleIcon(mod.type)}</div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Module {mod.order} — {mod.type}</span>
                          <h3 className="font-bold text-sm text-slate-800 truncate mt-0.5">{mod.title}</h3>
                          <a href={mod.contentUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-1"><span>Open Resource</span><ExternalLink className="w-3 h-3" /></a>
                        </div>
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg shrink-0">
                          <CheckCircle className="w-4 h-4" /><span className="hidden sm:inline">Completed</span>
                        </div>
                      ) : (
                        <button onClick={() => onCompleteModule(id, mod.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-bold transition-all shrink-0">
                          <Circle className="w-4 h-4" /><span>Mark Complete</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl p-6 border border-indigo-100 bg-indigo-50">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" /><span>Discussion Board</span>
            </h3>
            <p className="text-xs text-indigo-700 mb-4 leading-relaxed">Have questions or want to study with peers? Participate in the course discussion forum.</p>
            <button onClick={() => onNavigate(`student/forum/${id}`)} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm">
              <span>Join Discussion Board</span>
            </button>
          </div>

          <div className="rounded-2xl glass p-6 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-600 text-xs font-bold">2</span>
              <span>Assessments</span>
            </h2>
            {assessments.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">No assignments or quizzes scheduled yet.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {assessments.map((ass) => {
                  const hasSub = ass.isSubmitted;
                  return (
                    <div key={ass.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${hasSub ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-extrabold tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500">{ass.type}</span>
                          <h4 className="font-bold text-xs text-slate-800 mt-1.5">{ass.title}</h4>
                        </div>
                        {hasSub && (
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-500 block">Grade</span>
                            <span className="text-sm font-extrabold text-emerald-600">{ass.submission.score.toFixed(1)} / {ass.maxScore}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-100 pt-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> Due: {formatDate(ass.dueDate)}</span>
                        {hasSub ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Submitted</span>
                        ) : (
                          <button onClick={() => { onSelectAssessment(ass.id); onNavigate(`student/assessment/${ass.id}`); }} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm">Open</button>
                        )}
                      </div>
                      {hasSub && ass.submission.feedback && (
                        <div className="mt-1 p-2 rounded bg-blue-50 border border-blue-100 text-[10px] text-slate-600 flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" /><span>Feedback: {ass.submission.feedback}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
