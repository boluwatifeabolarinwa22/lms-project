import React from 'react';
import { BookOpen, Calendar, Clock, Award, Activity, AlertTriangle, PlayCircle, AlertCircle, MessageSquare } from 'lucide-react';

export default function StudentDashboard({ data, messages = [], onMarkMessageAsRead, onNavigate, onSelectCourse, onSelectAssessment }) {
  if (data && data.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Dashboard Error</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{data.error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-slate-500">Loading Dashboard...</div>;

  const { enrolledCourses = [], upcomingAssessments = [], recentActivities = [], performanceChartData = [], summary = {} } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderLineChart = () => {
    if (performanceChartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500">
          <Award className="w-8 h-8 mb-2 text-slate-400" />
          <span className="text-sm">No grades recorded yet. Complete assessments to see your trend.</span>
        </div>
      );
    }

    const width = 600;
    const height = 220;
    const paddingX = 50;
    const paddingY = 30;
    const chartWidth = width - 2 * paddingX;
    const chartHeight = height - 2 * paddingY;

    const points = performanceChartData.map((d, idx) => {
      const x = performanceChartData.length > 1 ? paddingX + (idx / (performanceChartData.length - 1)) * chartWidth : paddingX + chartWidth / 2;
      const y = height - paddingY - (d.scorePercent / 100) * chartHeight;
      return { x, y, ...d };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto">
          {[0, 25, 50, 75, 100].map((gridVal) => {
            const yVal = height - paddingY - (gridVal / 100) * chartHeight;
            return (
              <g key={gridVal}>
                <line x1={paddingX} y1={yVal} x2={width - paddingX} y2={yVal} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <text x={paddingX - 10} y={yVal + 4} fill="#64748b" fontSize="10" textAnchor="end" className="font-semibold">{gridVal}%</text>
              </g>
            );
          })}
          {points.length > 1 && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_4px_8px_rgba(59,130,246,0.3)]" />}
          {points.map((pt, idx) => (
            <g key={idx} className="group">
              <circle cx={pt.x} cy={pt.y} r="6" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" className="cursor-pointer transition-all hover:r-8" />
              <foreignObject x={pt.x - 60} y={pt.y - 65} width="120" height="55" className="overflow-visible pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white border border-slate-200 text-[10px] text-slate-700 p-2 rounded-lg shadow-xl text-center">
                  <div className="font-bold truncate">{pt.assessmentTitle}</div>
                  <div className="text-blue-600 font-semibold">{pt.scorePercent.toFixed(1)}%</div>
                </div>
              </foreignObject>
            </g>
          ))}
          {points.map((pt, idx) => (
            <text key={idx} x={pt.x} y={height - paddingY + 18} fill="#64748b" fontSize="9" textAnchor="middle" className="font-medium">Test {idx + 1}</text>
          ))}
        </svg>
      </div>
    );
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 45) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High Risk': return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-50 border border-red-200 text-red-600 pulse-risk-red">High Risk</span>;
      case 'Moderate Risk': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-600 pulse-risk-amber">Moderate Risk</span>;
      case 'Low Risk': default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-600">Low Risk</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Student Learning Space</h1>
          <p className="text-slate-600 text-sm">Monitor your progress, complete modules, and check your analytical performance.</p>
        </div>
        <div className="flex gap-4 z-10">
          <div className="px-4 py-3 rounded-xl bg-white shadow-sm border border-slate-200 text-center min-w-[100px]">
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Engagement</span>
            <span className={`text-lg font-black ${summary.avgEngagement >= 0.75 ? 'text-emerald-600' : summary.avgEngagement >= 0.4 ? 'text-amber-500' : 'text-red-500'}`}>
              {(summary.avgEngagement * 100).toFixed(0)}%
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-white shadow-sm border border-slate-200 text-center min-w-[100px]">
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Academic Status</span>
            <span className="mt-1 block">{getRiskBadge(summary.overallRisk)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="rounded-2xl glass p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Enrolled Courses</h2>
              </div>
              <button onClick={() => onNavigate('student/courses')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Browse Catalog →
              </button>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                You are not enrolled in any courses yet.
                <button onClick={() => onNavigate('student/courses')} className="mt-4 block mx-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md">
                  Explore Course Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrolledCourses.map((c) => (
                  <div key={c.id} className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group">
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{c.title}</h3>
                      <span className="text-xs text-slate-500 block mb-3">Taught by {c.instructorName}</span>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">{c.description}</p>
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
                        <span>Completion Progress</span>
                        <span>{(c.completionStatus || 0).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden border border-slate-200/50">
                        <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(c.completionStatus || 0)}`} style={{ width: `${c.completionStatus || 0}%` }} />
                      </div>
                      <button onClick={() => { onSelectCourse(c.id); onNavigate(`student/course/${c.id}`); }} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition-all">
                        <PlayCircle className="w-4 h-4" />
                        <span>Resume Learning</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl glass p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Performance Trend</h2>
                <p className="text-xs text-slate-500">Linear regression of assessment grades over time</p>
              </div>
            </div>
            {renderLineChart()}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Messages & Support notifications */}
          <div className="rounded-2xl glass p-6 border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Messages & Support</h2>
              </div>
              {messages.some(m => !m.isRead) && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                  {messages.filter(m => !m.isRead).length} New
                </span>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
                No messages or interventions from your instructors.
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => !m.isRead && onMarkMessageAsRead && onMarkMessageAsRead(m.id)}
                    className={`p-4 rounded-xl border transition-all relative cursor-pointer ${
                      m.isRead
                        ? 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                        : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/80 hover:border-blue-300'
                    }`}
                  >
                    {!m.isRead && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold text-slate-800">
                        {m.sender.role === 'INSTRUCTOR' ? 'Message from your Instructor' : 'Support Message'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                        m.type === 'Adjust Content'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : m.type === 'Schedule Support'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {m.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mb-2 leading-relaxed whitespace-pre-line">{m.content}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200/40">
                      <span className="font-semibold text-slate-500">From: {m.sender.name}</span>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl glass p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Upcoming Tasks</h2>
            </div>
            {upcomingAssessments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No upcoming assessments due.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingAssessments.map((ass) => (
                  <div key={ass.id} className="p-4 rounded-xl bg-white shadow-sm border border-slate-200 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-800 truncate">{ass.title}</h3>
                      <span className="text-[10px] text-blue-600 font-semibold block">{ass.course?.title || 'Unknown Course'}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-slate-400" /> Due: {formatDate(ass.dueDate)}
                      </span>
                    </div>
                    <button onClick={() => { onSelectAssessment(ass.id); onNavigate(`student/assessment/${ass.id}`); }} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all shadow-sm shrink-0">
                      Start
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl glass p-6 border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
            </div>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No activity logged yet.</div>
            ) : (
              <div className="flex flex-col gap-4 relative pl-4 border-l border-slate-200">
                {recentActivities.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white shadow-sm group-hover:scale-125 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block capitalize">{act.type.replace('_', ' ')}</span>
                      {act.course && <span className="text-[10px] text-slate-500 block">{act.course.title}</span>}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Duration: {act.duration} mins</span>
                        <span>{formatDate(act.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
