import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, UploadCloud } from 'lucide-react';

export default function StudentAssessment({ assessmentData, onNavigate, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [assignmentText, setAssignmentText] = useState('');
  const [timeLeft, setTimeLeft] = useState(3600);

  const isQuiz = assessmentData?.assessment?.type === 'quiz';
  const isSubmitted = assessmentData?.isSubmitted;

  useEffect(() => {
    if (!isSubmitted && isQuiz && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, isSubmitted, isQuiz]);

  if (assessmentData && assessmentData.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Assessment Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{assessmentData.error}</p>
          <button onClick={() => onNavigate('student/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!assessmentData || !assessmentData.assessment) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">No Assessment Available</h2>
          <p className="text-slate-600 text-sm leading-relaxed">No assignment or quiz is available at this time. Please check back later.</p>
          <button onClick={() => onNavigate('student/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { assessment, submission } = assessmentData;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = () => {
    if (isQuiz) onSubmit(assessment.id, assessment.course?.id || '', { answers });
    else onSubmit(assessment.id, assessment.course?.id || '', { assignmentContent: assignmentText });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      <button 
        onClick={() => {
          if (assessment.course?.id) {
            onNavigate(`student/course/${assessment.course.id}`);
          } else {
            onNavigate('student/dashboard');
          }
        }} 
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /><span>Back to Course</span>
      </button>

      <div className="p-6 rounded-2xl glass border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded mb-2 inline-block">
            {assessment.type}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{assessment.title}</h1>
          <p className="text-slate-500 text-sm">{assessment.course?.title || 'Unknown Course'}</p>
        </div>
        
        <div className="flex gap-4">
          {!isSubmitted && isQuiz && (
            <div className={`p-4 rounded-xl border flex flex-col items-center justify-center min-w-[100px] ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-700'}`}>
              <Clock className="w-5 h-5 mb-1" />
              <span className="text-lg font-black font-mono tracking-wider">{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-200 text-center min-w-[100px]">
            <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider mb-1">Max Score</span>
            <span className="text-xl font-black text-slate-900">{assessment.maxScore}</span>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        <div className="p-8 rounded-2xl glass-premium border border-emerald-200 flex flex-col items-center justify-center text-center py-16 relative overflow-hidden bg-emerald-50/30">
          <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 z-10" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2 z-10">Assessment Completed</h2>
          <div className="text-4xl font-black text-emerald-600 my-4 z-10">
            {submission?.score?.toFixed(1) || 0} <span className="text-xl text-slate-400">/ {assessment.maxScore}</span>
          </div>
          <p className="text-slate-600 max-w-md z-10 leading-relaxed mb-6">You have successfully completed this assessment. Your score has been recorded and factored into your analytics profile.</p>
          {submission?.feedback && (
            <div className="p-4 rounded-xl bg-white shadow-sm border border-slate-200 text-sm text-slate-600 w-full max-w-lg z-10 flex items-start gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div><span className="font-bold block mb-1 text-slate-800">Instructor Feedback:</span>{submission.feedback}</div>
            </div>
          )}
        </div>
      ) : (!assessment.questions || assessment.questions.length === 0) ? (
        <div className="p-8 rounded-2xl glass border border-amber-200 bg-amber-50/30 flex flex-col items-center justify-center text-center py-16 shadow-sm">
          <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Assessment Content Not Available</h2>
          <p className="text-slate-600 text-sm max-w-md leading-relaxed mb-6">
            The instructor has not uploaded the questions or instructions for this {assessment.type === 'quiz' ? 'quiz' : 'assignment'} yet. Please contact your instructor or check back later.
          </p>
          <button 
            onClick={() => {
              if (assessment.course?.id) {
                onNavigate(`student/course/${assessment.course.id}`);
              } else {
                onNavigate('student/dashboard');
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            Back to Course Syllabus
          </button>
        </div>
      ) : (
        <div className="p-8 rounded-2xl glass border border-slate-200">
          {isQuiz ? (
            <div className="flex flex-col gap-10">
              {(Array.isArray(assessment.questions) ? assessment.questions : []).map((q, idx) => {
                if (!q) return null;
                return (
                  <div key={q.id}>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex gap-3">
                      <span className="text-blue-600">{idx + 1}.</span><span>{q.text}</span>
                    </h3>
                    <div className="flex flex-col gap-3 pl-7">
                      {(Array.isArray(q.options) ? q.options : []).map((opt, oIdx) => (
                        <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                          <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} className="w-4 h-4 text-blue-600 bg-white border-slate-300 focus:ring-blue-500" />
                          <span className="text-sm font-medium text-slate-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {assessment.questions && assessment.questions.length > 0 && assessment.questions[0] && (
                <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/30 text-slate-700 text-sm">
                  <h4 className="font-bold text-slate-900 mb-2">Assignment Instructions:</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{assessment.questions[0].text || ''}</p>
                </div>
              )}
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <h3 className="text-slate-800 font-bold mb-1">Upload Assignment File</h3>
                <p className="text-slate-500 text-xs mb-4">PDF, DOCX, or ZIP allowed (Mock interface)</p>
                <button className="px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">Browse Files</button>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Or paste your submission text/link here:</label>
                <textarea value={assignmentText} onChange={(e) => setAssignmentText(e.target.value)} placeholder="Enter your repository link or assignment contents..." className="w-full h-32 p-4 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm shadow-sm" />
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
            <button onClick={handleSubmit} className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-all hover:scale-105 active:scale-95">Submit Assessment</button>
          </div>
        </div>
      )}
    </div>
  );
}
