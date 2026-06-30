import React, { useState } from 'react';
import { PlusCircle, Save, Layers, Trash2, FileText, CheckSquare, Calendar, HelpCircle, Plus } from 'lucide-react';

export default function InstructorCourseBuilder({ 
  courses = [], 
  onCreateCourse, 
  onAddModule, 
  onDeleteModule, 
  onCreateAssessment 
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || null);
  const [newCourse, setNewCourse] = useState({ title: '', description: '' });
  const [newModule, setNewModule] = useState({ title: '', type: 'VIDEO', contentUrl: '', order: 1 });

  // Assessment form states
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    type: 'quiz',
    maxScore: 100,
    dueDate: ''
  });
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    opt1: '',
    opt2: '',
    opt3: '',
    opt4: '',
    correctAnswer: ''
  });

  const activeCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  const handleCreateCourse = (e) => {
    e.preventDefault();
    onCreateCourse(newCourse);
    setNewCourse({ title: '', description: '' });
  };

  const handleAddModule = (e) => {
    e.preventDefault();
    if (!activeCourse) return;
    onAddModule(activeCourse.id, newModule);
    setNewModule({ title: '', type: 'VIDEO', contentUrl: '', order: newModule.order + 1 });
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text || !currentQuestion.correctAnswer) return;
    const opts = [currentQuestion.opt1, currentQuestion.opt2, currentQuestion.opt3, currentQuestion.opt4].filter(Boolean);
    if (opts.length < 2) return; // Must have at least 2 options
    
    setDraftQuestions(prev => [
      ...prev,
      {
        text: currentQuestion.text,
        options: opts,
        correctAnswer: currentQuestion.correctAnswer
      }
    ]);
    
    setCurrentQuestion({ text: '', opt1: '', opt2: '', opt3: '', opt4: '', correctAnswer: '' });
  };

  const handleCreateAssessment = (e) => {
    e.preventDefault();
    if (!activeCourse) return;
    
    const payloadQuestions = assessmentForm.type === 'quiz' 
      ? draftQuestions 
      : [{ text: assignmentInstructions, options: [], correctAnswer: '' }];

    onCreateAssessment(activeCourse.id, {
      title: assessmentForm.title,
      type: assessmentForm.type,
      maxScore: parseInt(assessmentForm.maxScore),
      dueDate: assessmentForm.dueDate,
      questions: payloadQuestions
    });
    setAssessmentForm({
      title: '',
      type: 'quiz',
      maxScore: 100,
      dueDate: ''
    });
    setDraftQuestions([]);
    setAssignmentInstructions('');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Course Content Builder</h1>
        <p className="text-slate-500 text-sm">Create course offerings, manage learning modules, and schedule syllabus assessments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Create Course & List Courses */}
        <div className="flex flex-col gap-6">
          <form onSubmit={handleCreateCourse} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" /> Propose New Course
            </h3>
            <div className="flex flex-col gap-3">
              <input 
                required 
                placeholder="Course Title" 
                value={newCourse.title} 
                onChange={e => setNewCourse({...newCourse, title: e.target.value})} 
                className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm" 
              />
              <textarea 
                required 
                placeholder="Course Description" 
                value={newCourse.description} 
                onChange={e => setNewCourse({...newCourse, description: e.target.value})} 
                className="p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-24 shadow-sm" 
              />
              <button type="submit" className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md">
                Propose Course
              </button>
            </div>
          </form>

          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Your Active Courses</h3>
            {courses.length === 0 ? (
              <p className="text-xs text-slate-500">No courses proposed yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {courses.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => setSelectedCourseId(c.id)} 
                    className={`text-left p-4 rounded-xl border transition-all ${
                      (activeCourse && activeCourse.id === c.id) 
                        ? 'bg-indigo-50/50 border-indigo-300 text-indigo-900 font-bold shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate text-sm">{c.title}</div>
                    <div className="flex gap-3 text-[10px] text-slate-400 mt-2">
                      <span>{c.modules?.length || 0} Modules</span>
                      <span>•</span>
                      <span>{c.assessments?.length || 0} Assessments</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Modules and Assessments Management */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeCourse ? (
            <>
              {/* 1. Modules Section */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 mb-1">{activeCourse.title}</h2>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">{activeCourse.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    activeCourse.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {activeCourse.status}
                  </span>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Layers className="w-4 h-4 text-indigo-600" /> Syllabus Modules
                  </h3>
                  
                  {(!activeCourse.modules || activeCourse.modules.length === 0) ? (
                    <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200/50">
                      No learning modules uploaded yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeCourse.modules.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/50 border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 shadow-sm">
                              {m.order}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{m.title}</div>
                              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block mt-0.5">{m.type}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => onDeleteModule(activeCourse.id, m.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            title="Delete Module"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Module Form */}
                <form onSubmit={handleAddModule} className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-4 mt-2">
                  <h4 className="font-bold text-slate-800 text-xs">Add New Module</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      required 
                      placeholder="Module Title" 
                      value={newModule.title} 
                      onChange={e => setNewModule({...newModule, title: e.target.value})} 
                      className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm" 
                    />
                    <select 
                      value={newModule.type} 
                      onChange={e => setNewModule({...newModule, type: e.target.value})} 
                      className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                    >
                      <option value="VIDEO">Video</option>
                      <option value="DOC">Document</option>
                      <option value="LINK">External Link</option>
                    </select>
                    <input 
                      required 
                      placeholder="Content URL (e.g. https://...)" 
                      value={newModule.contentUrl} 
                      onChange={e => setNewModule({...newModule, contentUrl: e.target.value})} 
                      className="md:col-span-2 p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm" 
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-500 font-bold shrink-0">Sequence Order:</label>
                      <input 
                        type="number" 
                        min="1" 
                        required 
                        value={newModule.order} 
                        onChange={e => setNewModule({...newModule, order: parseInt(e.target.value)})} 
                        className="p-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm w-20" 
                      />
                    </div>
                  </div>
                  <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md rounded-lg self-end">
                    <Save className="w-4 h-4" /> Save Module
                  </button>
                </form>
              </div>

              {/* 2. Assessments Section */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Syllabus Assessments
                  </h3>
                  
                  {(!activeCourse.assessments || activeCourse.assessments.length === 0) ? (
                    <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200/50 mt-4">
                      No assignments or quizzes scheduled yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 mt-4">
                      {activeCourse.assessments.map((ass) => (
                        <div key={ass.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-200 shadow-sm flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] uppercase font-bold tracking-wider bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-slate-500">
                                {ass.type}
                              </span>
                              <h4 className="font-bold text-slate-800 text-sm mt-2">{ass.title}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 block">Max Score</span>
                              <span className="text-sm font-black text-slate-800">{ass.maxScore}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {formatDate(ass.dueDate)}</span>
                            {ass.type === 'quiz' && (
                              <span className="font-semibold text-indigo-600">{ass.questions?.length || 0} Questions</span>
                            )}
                          </div>

                          {/* Quiz questions detail list */}
                          {ass.type === 'quiz' && ass.questions && ass.questions.length > 0 && (
                            <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col gap-2.5">
                              <span className="text-[9px] uppercase font-extrabold text-slate-400 block border-b border-slate-100 pb-1">Quiz Questions Details</span>
                              {ass.questions.map((q, qidx) => (
                                <div key={q.id} className="text-xs text-slate-700">
                                  <div className="font-bold mb-1">{qidx + 1}. {q.text}</div>
                                  <div className="pl-3 text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                                    <span>Choices: {JSON.parse(q.options).join(', ')}</span>
                                    <span className="font-bold text-emerald-600">Correct: {q.correctAnswer}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Assignment instructions detail list */}
                          {ass.type === 'assignment' && ass.questions && ass.questions.length > 0 && (
                            <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col gap-1.5 shadow-sm">
                              <span className="text-[9px] uppercase font-extrabold text-slate-400 block border-b border-slate-100 pb-1">Assignment Instructions</span>
                              <div className="text-xs text-slate-650 whitespace-pre-wrap leading-relaxed">{ass.questions[0].text}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create Assessment Form */}
                <form onSubmit={handleCreateAssessment} className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-4">
                  <h4 className="font-bold text-slate-800 text-xs">Create New Assessment</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Assessment Title</label>
                      <input 
                        required 
                        placeholder="Enter title" 
                        value={assessmentForm.title} 
                        onChange={e => setAssessmentForm({...assessmentForm, title: e.target.value})} 
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 outline-none shadow-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Assessment Type</label>
                      <select 
                        value={assessmentForm.type} 
                        onChange={e => setAssessmentForm({...assessmentForm, type: e.target.value})} 
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 outline-none shadow-sm"
                      >
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Max Score</label>
                      <input 
                        type="number" 
                        required 
                        value={assessmentForm.maxScore} 
                        onChange={e => setAssessmentForm({...assessmentForm, maxScore: e.target.value})} 
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 outline-none shadow-sm" 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Due Date</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={assessmentForm.dueDate} 
                        onChange={e => setAssessmentForm({...assessmentForm, dueDate: e.target.value})} 
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 outline-none shadow-sm" 
                      />
                    </div>
                  </div>

                  {assessmentForm.type === 'assignment' && (
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Assignment Instructions / Prompt</label>
                      <textarea 
                        required
                        placeholder="Describe the assignment task, requirements, and submission details..." 
                        value={assignmentInstructions}
                        onChange={e => setAssignmentInstructions(e.target.value)}
                        className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:border-indigo-500 outline-none h-32 shadow-sm" 
                      />
                      <div className="p-3 border border-blue-100 rounded-lg bg-blue-50/30 text-[10px] text-blue-700 leading-relaxed mt-1">
                        <strong>Assignment Note:</strong> Students will submit files or repository links directly which you can grade later.
                      </div>
                    </div>
                  )}

                  {/* If Quiz: Questions Constructor */}
                  {assessmentForm.type === 'quiz' && (
                    <div className="border-t border-slate-200 pt-4 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-xs text-indigo-700 flex items-center gap-1">
                          <HelpCircle className="w-4 h-4" /> Quiz Questions Constructor
                        </h5>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {draftQuestions.length} Questions Added
                        </span>
                      </div>

                      {/* Display added questions */}
                      {draftQuestions.length > 0 && (
                        <div className="flex flex-col gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                          {draftQuestions.map((q, idx) => (
                            <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                              <div>
                                <span className="font-bold block text-slate-800">{idx + 1}. {q.text}</span>
                                <span className="text-[10px] text-slate-500">Options: {q.options.join(' | ')}</span>
                              </div>
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded">
                                Correct: {q.correctAnswer}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Question input block */}
                      <div className="p-4 border border-indigo-100 rounded-xl bg-indigo-50/30 flex flex-col gap-3">
                        <input 
                          placeholder="Question Text" 
                          value={currentQuestion.text}
                          onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                          className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none shadow-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            placeholder="Option 1" 
                            value={currentQuestion.opt1}
                            onChange={e => setCurrentQuestion({...currentQuestion, opt1: e.target.value})}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none shadow-sm"
                          />
                          <input 
                            placeholder="Option 2" 
                            value={currentQuestion.opt2}
                            onChange={e => setCurrentQuestion({...currentQuestion, opt2: e.target.value})}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none shadow-sm"
                          />
                          <input 
                            placeholder="Option 3" 
                            value={currentQuestion.opt3}
                            onChange={e => setCurrentQuestion({...currentQuestion, opt3: e.target.value})}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none shadow-sm"
                          />
                          <input 
                            placeholder="Option 4" 
                            value={currentQuestion.opt4}
                            onChange={e => setCurrentQuestion({...currentQuestion, opt4: e.target.value})}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none shadow-sm"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-500 font-bold shrink-0">Correct Choice:</label>
                          <input 
                            placeholder="Must match one of options EXACTLY" 
                            value={currentQuestion.correctAnswer}
                            onChange={e => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none shadow-sm flex-1"
                          />
                          <button 
                            type="button" 
                            onClick={handleAddQuestion}
                            className="flex items-center gap-1 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Question
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md rounded-lg self-end mt-2">
                    <Save className="w-4 h-4" /> Save Assessment
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full rounded-2xl border border-slate-200 border-dashed bg-slate-50 flex flex-col items-center justify-center p-12 text-slate-400">
              <Layers className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a course from the left to manage its syllabus content and assessments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
