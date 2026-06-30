import React from 'react';
import { AlertTriangle, UserSearch, Mail, Clock, ShieldAlert, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function InstructorRiskAlerts({ alerts, onNavigate, onSelectStudent, onTriggerIntervention }) {
  if (alerts && alerts.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Alerts Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{alerts.error}</p>
          <button onClick={() => onNavigate('instructor/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  const getRiskBadge = (risk) => {
    if (risk === 'High Risk') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 pulse-risk-red">
          <ShieldAlert className="w-3.5 h-3.5" /> High Risk
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" /> Moderate Risk
      </span>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-premium bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50/50 rounded-full blur-3xl" />
        <div className="z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Risk Alerts Center</h1>
          <p className="text-slate-500 text-sm">
            Monitor students whose engagement levels or grades have dropped below critical thresholds.
          </p>
        </div>
      </div>

      {safeAlerts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">No Risk Alerts</h2>
          <p className="text-slate-500 text-sm max-w-md">
            All students are currently performing nominally and meeting platform engagement criteria.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {safeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-2xl bg-white border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-slate-300 ${
                alert.riskLevel === 'High Risk' ? 'border-red-100 hover:shadow-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div
                  className={`p-3.5 rounded-xl shrink-0 ${
                    alert.riskLevel === 'High Risk' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getRiskBadge(alert.riskLevel)}
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                      {alert.courseTitle}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(alert.timestamp)}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base mb-1">{alert.studentName}</h3>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {alert.studentEmail}
                  </p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed max-w-3xl">
                    {alert.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col items-center gap-3 shrink-0 self-end lg:self-center w-full lg:w-auto justify-end">
                <button
                  onClick={() => {
                    onSelectStudent(alert.studentId);
                    onNavigate(`instructor/analytics/${alert.studentId}`);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
                >
                  <UserSearch className="w-4 h-4 text-slate-500" />
                  <span>Drill Down</span>
                </button>
                <button
                  onClick={() => onTriggerIntervention(alert.studentId, alert.courseId, 'Send Message', `Risk Alert Intervention Action for ${alert.studentName}`)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-100 transition-all w-full lg:w-auto"
                >
                  <span>Quick Intervention</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
