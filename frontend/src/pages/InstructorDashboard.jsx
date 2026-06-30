import React from 'react';
import { Users, AlertTriangle, TrendingUp, BookOpen, Activity, UserSearch } from 'lucide-react';

export default function InstructorDashboard({ data, onNavigate, onSelectStudent }) {
  if (!data) return <div className="text-center py-12 text-slate-500">Loading Instructor Dashboard...</div>;

  const { summary, performanceDistribution, atRiskStudents } = data;

  const getRiskBadge = (risk) => {
    if (risk === 'High Risk') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 pulse-risk-red whitespace-nowrap">High Risk</span>;
    if (risk === 'Moderate Risk') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 pulse-risk-amber whitespace-nowrap">Moderate Risk</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 whitespace-nowrap">Low Risk</span>;
  };

  const getPerfColor = (cat) => {
    if(cat === 'Distinction') return 'bg-emerald-500';
    if(cat === 'Merit') return 'bg-blue-500';
    if(cat === 'Pass') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const totalPerf = performanceDistribution ? performanceDistribution.reduce((sum, d) => sum + d.count, 0) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-premium relative overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="absolute top-0 left-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl" />
        <div className="z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Instructor Overview</h1>
          <p className="text-slate-500 text-sm">Monitor class performance, engagement metrics, and identify at-risk students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100"><BookOpen className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Active Courses</span>
            <span className="text-2xl font-black text-slate-900">{summary?.totalCourses || 0}</span>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-100"><Users className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-black text-slate-900">{summary?.totalStudents || 0}</span>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"><Activity className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Avg Engagement</span>
            <span className="text-2xl font-black text-slate-900">{((summary?.avgEngagementScore || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 pulse-risk-red"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">At Risk Alerts</span>
            <span className="text-2xl font-black text-red-600">{summary?.atRiskCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="rounded-2xl glass p-6 border border-slate-200 bg-white shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />Class Performance
          </h2>
          
          <div className="flex flex-col gap-5">
            {performanceDistribution?.map(d => {
              const perc = totalPerf > 0 ? (d.count / totalPerf) * 100 : 0;
              return (
                <div key={d.name}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">{d.name}</span>
                    <span className="text-slate-500">{d.count} students ({perc.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2">
                    <div className={`h-full rounded-full ${getPerfColor(d.name)}`} style={{ width: `${perc}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl glass p-6 border border-slate-200 bg-white shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />Priority Intervention List
          </h2>

          {!atRiskStudents || atRiskStudents.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No at-risk students identified. Excellent class performance!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Student</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Engagement</th>
                    <th className="px-4 py-3">Risk Level</th>
                    <th className="px-4 py-3 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map((s) => (
                    <tr key={`${s.studentId}-${s.courseId}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.studentName}</div>
                        <div className="text-[10px] text-slate-500">{s.studentEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{s.courseTitle}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${s.engagementScore < 0.4 ? 'text-red-600' : 'text-amber-500'}`}>
                          {(s.engagementScore * 100).toFixed(0)}% ({s.engagementBand})
                        </span>
                      </td>
                      <td className="px-4 py-3">{getRiskBadge(s.riskLevel)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { onSelectStudent(s.studentId); onNavigate(`instructor/analytics/${s.studentId}`); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-xs font-bold text-slate-700 hover:text-indigo-700 rounded transition-colors shadow-sm">
                          <UserSearch className="w-3.5 h-3.5" /> Drill Down
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
