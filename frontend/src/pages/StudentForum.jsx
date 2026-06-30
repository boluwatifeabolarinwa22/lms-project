import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send, User, Reply, AlertCircle } from 'lucide-react';

export default function StudentForum({ posts = [], onNavigate, onPostMessage, courseId }) {
  const [newPostContent, setNewPostContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  if (posts && posts.error) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center flex flex-col items-center gap-6">
        <div className="p-6 rounded-2xl glass border border-slate-200 shadow-sm w-full bg-white flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-slate-900">Forum Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{posts.error}</p>
          <button onClick={() => onNavigate(courseId ? `student/course/${courseId}` : 'student/dashboard')} className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all">
            Go Back to Course
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    onPostMessage(courseId, newPostContent, replyTo);
    setNewPostContent('');
    setReplyTo(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const safePosts = Array.isArray(posts) ? posts : [];
  const mainPosts = safePosts.filter(p => !p.parentId);
  const replies = safePosts.filter(p => p.parentId);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6 h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between shrink-0">
        <button onClick={() => onNavigate(courseId ? `student/course/${courseId}` : 'student/dashboard')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span>Back to Course</span>
        </button>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Course Discussion Board</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {mainPosts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p>No discussions yet. Be the first to start a topic!</p>
          </div>
        ) : (
          mainPosts.map(post => (
            <div key={post.id} className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${post.user.role === 'INSTRUCTOR' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {post.user.name[0]}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-800">{post.user.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">{post.user.role}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{formatDate(post.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed pl-10 whitespace-pre-wrap">{post.content}</p>
              
              <div className="pl-10 flex gap-2">
                <button onClick={() => setReplyTo(post.id)} className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                  <Reply className="w-3 h-3" /> Reply
                </button>
              </div>

              {replies.filter(r => r.parentId === post.id).map(reply => (
                <div key={reply.id} className="ml-10 mt-3 p-4 bg-white rounded-lg border border-slate-200 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">{reply.user.name[0]}</div>
                      <span className="font-bold text-xs text-slate-700">{reply.user.name}</span>
                      {reply.user.role === 'INSTRUCTOR' && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded">Instructor</span>}
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDate(reply.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">{reply.content}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 rounded-2xl glass p-4 border border-slate-200 flex flex-col gap-2 shadow-sm bg-white">
        {replyTo && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-1.5 rounded text-xs text-slate-600 mb-1">
            <span>Replying to thread...</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-slate-800">Cancel</button>
          </div>
        )}
        <div className="flex items-end gap-3">
          <textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Type your message here..." className="flex-1 max-h-32 min-h-[50px] p-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-y shadow-sm" />
          <button type="submit" disabled={!newPostContent.trim()} className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shrink-0 shadow-md">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
