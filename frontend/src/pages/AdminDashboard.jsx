import React, { useState } from 'react';
import { Users, BookOpen, AlertCircle, Database, CheckCircle, Shield, XCircle, UserCheck, Trash2, Settings, FileSpreadsheet, PlayCircle } from 'lucide-react';

export default function AdminDashboard({ 
  view, 
  data, 
  onApproveCourse, 
  onUpdateUserRole, 
  onDeleteUser, 
  onUpdateConfig 
}) {
  if (!data) return <div className="text-center py-12 text-slate-500">Loading System Data...</div>;

  const { users = [], courses = [], reports = {}, config = {} } = data;
  const pendingCourses = courses?.filter(c => c.status === 'PENDING') || [];
  const approvedCourses = courses?.filter(c => c.status === 'APPROVED') || [];

  // Form State for Config
  const [configForm, setConfigForm] = useState({
    systemName: config.systemName || 'EduPlus LMS',
    allowRegistration: config.allowRegistration !== undefined ? config.allowRegistration : true,
    riskThresholdDays: config.riskThresholdDays || 5,
    minPassingScore: config.minPassingScore || 45
  });

  const handleSaveConfig = (e) => {
    e.preventDefault();
    onUpdateConfig(configForm);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-premium relative overflow-hidden bg-white border border-rose-200 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 z-10">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100"><Shield className="w-8 h-8" /></div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
              {view === 'dashboard' && 'Admin Control Center'}
              {view === 'users' && 'User Accounts Directory'}
              {view === 'courses' && 'Course Approvals Queue'}
              {view === 'reports' && 'Global System Reports'}
              {view === 'config' && 'System Configuration'}
            </h1>
            <p className="text-slate-500 text-sm">
              {view === 'dashboard' && 'Platform administration overview, course approvals, and system reporting.'}
              {view === 'users' && 'Manage user profiles, modify roles, and deactivate system accounts.'}
              {view === 'courses' && 'Review course syllabus proposals and approve them for public listing.'}
              {view === 'reports' && 'Review aggregate platform statistics, course enrollment levels, and risk ratios.'}
              {view === 'config' && 'Configure custom passing scores, inactivity thresholds, and registration gates.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Content Tabs */}
      {view === 'dashboard' && (
        <div className="flex flex-col gap-8">
          {/* Dashboard Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Users</div>
              <div className="text-3xl font-black text-slate-900">{users.length}</div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <BookOpen className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Courses</div>
              <div className="text-3xl font-black text-slate-900">{courses.length}</div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Courses</div>
              <div className="text-3xl font-black text-slate-900">{pendingCourses.length}</div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <Database className="w-6 h-6 text-rose-500 mx-auto mb-2" />
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Platform Health</div>
              <div className="text-3xl font-black text-emerald-600">100%</div>
            </div>
          </div>

          {/* Quick Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl glass p-6 border border-slate-200 bg-white shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Pending Course Approvals</h2>
              {pendingCourses.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6 bg-slate-50 rounded-xl border border-slate-100">All courses are approved and active.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {pendingCourses.map(c => (
                    <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{c.title}</h3>
                        <p className="text-[10px] text-slate-500">Instructor: {c.instructor?.name || c.instructorId}</p>
                      </div>
                      <button onClick={() => onApproveCourse(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold transition-all">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl glass p-6 border border-slate-200 bg-white shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Platform Reporting (Global)</h2>
              {reports?.summary ? (
                <div className="flex flex-col gap-4 text-sm text-slate-700">
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-600">Avg. System Grade:</span>
                    <span className="text-blue-600 font-black">{reports.summary.overallAvgScore?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-600">Total At-Risk Students:</span>
                    <span className="text-red-600 font-black">{reports.summary.dropoutRiskCount || 0}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-600">Total Enrollments:</span>
                    <span className="text-indigo-600 font-black">{reports.summary.totalEnrollments || 0}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Reports data not available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 mb-4">User Accounts List</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created At</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-600">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <select 
                        value={u.role} 
                        onChange={(e) => onUpdateUserRole(u.id, e.target.value)}
                        className="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="INSTRUCTOR">INSTRUCTOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button 
                        onClick={() => onDeleteUser(u.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Deactivate Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Course approvals */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pending Approvals Queue</h2>
              <p className="text-slate-400 text-xs mt-0.5">Syllabus details proposed by course instructors.</p>
            </div>
            {pendingCourses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200/50 text-slate-500 text-sm">
                No pending course approvals.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingCourses.map(c => (
                  <div key={c.id} className="p-5 border border-slate-200 bg-slate-50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">{c.title}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed max-w-xl mb-2">{c.description}</p>
                      <span className="text-[10px] text-slate-400 font-medium">Instructor: {c.instructor?.name} ({c.instructor?.email})</span>
                    </div>
                    <button onClick={() => onApproveCourse(c.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all shadow-sm shrink-0">
                      <CheckCircle className="w-4 h-4" /> Approve Listing
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Courses */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-800">Approved Courses ({approvedCourses.length})</h2>
            <div className="flex flex-col gap-3">
              {approvedCourses.map(c => (
                <div key={c.id} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center gap-3">
                  <PlayCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{c.title}</h3>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mt-0.5">Active Listing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'reports' && (
        <div className="flex flex-col gap-8">
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50 text-sm text-blue-800 flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-1">About Global Reports</strong>
              Global Reports compile system-wide data on enrollment, average academic scores, and student dropout risks to help administrators evaluate the overall health and engagement of the platform.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Academic Performance</span>
              <div className="text-3xl font-black text-blue-600">{reports?.summary?.overallAvgScore?.toFixed(1) || 0}%</div>
              <p className="text-slate-400 text-xs mt-2">Overall Average Course Grade</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">High-Risk Students</span>
              <div className="text-3xl font-black text-red-600">{reports?.summary?.dropoutRiskCount || 0}</div>
              <p className="text-slate-400 text-xs mt-2">Dropout risk flags generated</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Course Enrollments</span>
              <div className="text-3xl font-black text-indigo-600">{reports?.summary?.totalEnrollments || 0}</div>
              <p className="text-slate-400 text-xs mt-2">Total student enrollments</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Course Enrollment statistics</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Course Title</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3">Enrolled Count</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports?.courseEnrolmentReport?.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{c.courseTitle}</td>
                      <td className="px-4 py-3.5 text-slate-600">{c.instructor}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">{c.enrolledCount} students</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col gap-6 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-500" /> System Tuning
          </h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">System Name</label>
            <input 
              type="text" 
              value={configForm.systemName}
              onChange={(e) => setConfigForm({...configForm, systemName: e.target.value})}
              className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
              required 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="text-sm font-bold text-slate-800 block">Allow Registration</label>
              <span className="text-xs text-slate-500 block">Allows students and instructors to register outside invite routes.</span>
            </div>
            <input 
              type="checkbox"
              checked={configForm.allowRegistration}
              onChange={(e) => setConfigForm({...configForm, allowRegistration: e.target.checked})}
              className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">At-Risk Threshold Inactivity (Days)</label>
              <input 
                type="number" 
                min="1"
                max="30"
                value={configForm.riskThresholdDays}
                onChange={(e) => setConfigForm({...configForm, riskThresholdDays: parseInt(e.target.value)})}
                className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                required 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700">Minimum Passing Score (%)</label>
              <input 
                type="number" 
                min="10"
                max="90"
                value={configForm.minPassingScore}
                onChange={(e) => setConfigForm({...configForm, minPassingScore: parseInt(e.target.value)})}
                className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-fit px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md hover:shadow-rose-100 transition-all self-end"
          >
            Save Configuration
          </button>
        </form>
      )}
    </div>
  );
}
