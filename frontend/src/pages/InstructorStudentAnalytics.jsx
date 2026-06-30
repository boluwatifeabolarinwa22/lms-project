import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Activity, AlertTriangle, BellRing, BrainCircuit, Calendar, AlertCircle } from 'lucide-react';

export default function InstructorStudentAnalytics({ studentData, onNavigate, onTriggerIntervention }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [interventionAction, setInterventionAction] = useState('Send Message');
  const [interventionNotes, setInterventionNotes] = useState('');

  const student = studentData?.student || {};
  const analytics = studentData?.analytics || [];
  const courses = studentData?.courses || [];
  const latestRec = analytics[0] || {};

  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].course?.id || '');
    }
  }, [courses]);

  if (!studentData) return <div className="text-center py-12 text-slate-500">Loading student analytics...</div>;

  if (studentData.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Analytics Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{studentData.error}</p>
          <button onClick={() => onNavigate('instructor/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getRiskBadge = (risk) => {
    if (risk === 'High Risk') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 pulse-risk-red">High Risk</span>;
    if (risk === 'Moderate Risk') return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 pulse-risk-amber">Moderate Risk</span>;
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Low Risk</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <button onClick={() => onNavigate('instructor/dashboard')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 p-6 rounded-2xl glass-premium border border-slate-200 bg-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{student.name}</h1>
            <p className="text-sm text-slate-500">{student.email}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 z-10">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">Status Profile</span>
            {getRiskBadge(latestRec.riskLevel)}
          </div>
          <button 
            onClick={() => {
              const firstCourseId = courses?.[0]?.course?.id;
              if (firstCourseId) {
                onTriggerIntervention(student.id, firstCourseId, 'Send Message', 'Quick intervention email triggered from student analytics page.');
              }
            }} 
            disabled={!courses || courses.length === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md"
          >
            <BellRing className="w-4 h-4" /> Quick Support Message
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Activity className="w-5 h-5 text-indigo-600 mb-2" />
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Engagement</div>
            <div className="text-xl font-black text-slate-900">{((latestRec.engagementScore || 0) * 100).toFixed(0)}%</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <BrainCircuit className="w-5 h-5 text-blue-600 mb-2" />
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Perf. Trend</div>
            <div className="text-xl font-black text-slate-900">{latestRec.performanceTrend > 0 ? '+' : ''}{latestRec.performanceTrend?.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Calendar className="w-5 h-5 text-emerald-600 mb-2" />
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Logins (30d)</div>
            <div className="text-xl font-black text-slate-900">{latestRec.loginFrequency || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Missed Deadlines</div>
            <div className="text-xl font-black text-slate-900">0</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass border border-slate-200 bg-white shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">AI Analytics Engine Output</h2>
          <div className="flex flex-col gap-4 text-sm text-slate-600">
            <p><strong className="text-slate-800">Engagement Band:</strong> {latestRec.engagementBand}</p>
            <p><strong className="text-slate-800">Time on Platform:</strong> {(latestRec.timeOnPlatform / 60).toFixed(1)} hrs</p>
            <p><strong className="text-slate-800">Content Access:</strong> {latestRec.contentAccessCount} modules</p>
            <p><strong className="text-slate-800">Forum Activity:</strong> {latestRec.forumParticipation} posts</p>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <strong className="text-slate-800 block mb-2">Automated Triggers Fired:</strong>
              {latestRec.triggers && latestRec.triggers.length > 0 ? (
                <ul className="list-disc pl-5 text-red-600 text-xs flex flex-col gap-1">
                  {latestRec.triggers.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              ) : (
                <span className="text-xs text-emerald-600 font-medium">None. Student is performing nominally.</span>
              )}
            </div>
          </div>
        </div>

        {/* Trigger Intervention Card */}
        <div className="p-6 rounded-2xl glass border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Trigger Support / Intervention
          </h2>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 uppercase">Target Course</label>
              <select 
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 outline-none shadow-sm focus:border-red-500"
              >
                {courses?.map(c => (
                  <option key={c.course.id} value={c.course.id}>{c.course.title}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 uppercase">Action Type</label>
              <select 
                value={interventionAction}
                onChange={e => setInterventionAction(e.target.value)}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 outline-none shadow-sm focus:border-red-500"
              >
                <option value="Send Message">Send Message</option>
                <option value="Schedule Support">Schedule Support</option>
                <option value="Adjust Content">Adjust Content</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-500 uppercase">Intervention Notes / Plan</label>
              <textarea 
                placeholder="E.g., Flagged student for tutoring, sent resource links..."
                value={interventionNotes}
                onChange={e => setInterventionNotes(e.target.value)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 outline-none h-20 shadow-sm focus:border-red-500 resize-none"
              />
            </div>

            <button 
              onClick={() => {
                onTriggerIntervention(student.id, selectedCourseId, interventionAction, interventionNotes);
                setInterventionNotes('');
              }}
              disabled={!selectedCourseId}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold transition-all shadow-md"
            >
              <BellRing className="w-4 h-4" /> <span>Trigger Action</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-2xl glass border border-slate-200 bg-white shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Course Progress</h2>
          <div className="flex flex-col gap-4">
            {courses?.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{c.course.title}</h3>
                  <span className="text-[10px] text-slate-500">{c.course.modules?.length || 0} Modules Total</span>
                </div>
                <div className="text-right min-w-[120px]">
                  <div className="text-xs font-bold text-emerald-600 mb-1">{c.completionProgress.toFixed(0)}% Completed</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="h-full bg-emerald-500 rounded-full" style={{width: `${c.completionProgress}%`}}/></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
