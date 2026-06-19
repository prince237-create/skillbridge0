"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Users, Search, ChevronDown, ChevronUp, FileText, Calendar, Clock, Video, Link as LinkIcon, X } from "lucide-react";
import { getStatusBadge, getStatusLabel, getMatchBg, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const ACTIONS = [
  { label: "Shortlist", value: "SHORTLISTED", color: "text-purple-400 hover:bg-purple-500/10" },
  { label: "Hire", value: "HIRED", color: "text-green-400 hover:bg-green-500/10" },
  { label: "Reject", value: "REJECTED", color: "text-red-400 hover:bg-red-500/10" },
];

async function fetchApplicants(status: string) {
  const qs = status !== "ALL" ? `?status=${status}` : "";
  const res = await fetch(`/api/applications${qs}`);
  if (!res.ok) throw new Error("Failed");
  return res.json().then((j) => j.data?.applications || []);
}

export default function ApplicantsPage() {
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [interviewModal, setInterviewModal] = useState<{ isOpen: boolean; appId: string | null }>({ isOpen: false, appId: null });
  const [interviewForm, setInterviewForm] = useState({ date: "", time: "", duration: 60, type: "Video", meetingUrl: "" });
  
  const queryClient = useQueryClient();

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["applicants", activeStatus],
    queryFn: () => fetchApplicants(activeStatus),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/applications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }).then((r) => r.json()),
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["applicants"] }); },
    onError: () => toast.error("Failed to update"),
  });

  const { mutate: scheduleInterview, isPending: isScheduling } = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/interviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error || "Failed to schedule");
        }
        return r.json();
      }),
    onSuccess: () => {
      toast.success("Interview scheduled successfully!");
      setInterviewModal({ isOpen: false, appId: null });
      queryClient.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewModal.appId || !interviewForm.date || !interviewForm.time) return toast.error("Date and time are required");
    
    // Combine date and time
    const scheduledAt = new Date(`${interviewForm.date}T${interviewForm.time}`).toISOString();
    
    scheduleInterview({
      applicationId: interviewModal.appId,
      scheduledAt,
      duration: Number(interviewForm.duration),
      type: interviewForm.type,
      meetingUrl: interviewForm.meetingUrl
    });
  };

  const filtered = applicants.filter((a: any) =>
    !search || a.user?.name?.toLowerCase().includes(search.toLowerCase()) || a.job?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_TABS = ["ALL", "PENDING", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "HIRED", "REJECTED"];

  return (
    <div className="page-container relative">
      <Sidebar role="EMPLOYER" />
      <div className="main-content">
        <TopBar title="Applicants" subtitle={`Total ${filtered.length} candidates`} />
        <div className="content-area max-w-5xl mx-auto">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applicants..." className="input-dark pl-9 w-full" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {STATUS_TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveStatus(tab)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeStatus === tab ? "bg-blue-600 text-white" : "bg-[#161b22] border border-[#21262d] text-slate-400 hover:text-white"}`}
                >
                  {tab === "ALL" ? "All" : getStatusLabel(tab)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-[#0d1117] border border-[#21262d] rounded-xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No applicants found</h3>
              <p className="text-slate-400 text-sm">Post a job to start receiving applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((app: any, i: number) => {
                const isExpanded = expandedId === app.id;
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="card-dark overflow-hidden transition-all duration-200 hover:border-slate-700"
                  >
                    <div className="p-5 flex items-center justify-between flex-wrap gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                          {app.user?.name?.charAt(0) || "?"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-semibold">{app.user?.name}</h3>
                            {app.matchScore && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getMatchBg(app.matchScore)}`}>{app.matchScore}% Match</span>
                            )}
                            <span className={`badge text-xs ${getStatusBadge(app.status)}`}>{getStatusLabel(app.status)}</span>
                          </div>
                          <p className="text-slate-400 text-sm">Applied for <span className="text-blue-400">{app.job?.title}</span></p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                            <span>{app.user?.profile?.location || "Location N/A"}</span>
                            <span>Applied {timeAgo(app.appliedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {ACTIONS.map((action) => (
                          <button key={action.value} onClick={() => updateStatus({ id: app.id, status: action.value })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent hover:border-current ${action.color} ${app.status === action.value ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={app.status === action.value}
                          >
                            {action.label}
                          </button>
                        ))}
                        
                        <button 
                          onClick={() => setInterviewModal({ isOpen: true, appId: app.id })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 ${app.status === 'INTERVIEW_SCHEDULED' ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={app.status === 'INTERVIEW_SCHEDULED'}
                        >
                          Interview
                        </button>

                        <button className="p-2 text-slate-400 hover:text-white transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-[#21262d] bg-[#090c10]"
                        >
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Applicant Details</h4>
                              <div className="space-y-2 text-sm">
                                <p className="text-slate-400"><strong className="text-slate-300">Email:</strong> {app.user?.email}</p>
                                <p className="text-slate-400"><strong className="text-slate-300">Headline:</strong> {app.user?.profile?.headline || "None"}</p>
                                {app.resume && (
                                  <div className="mt-4 p-3 bg-[#161b22] border border-[#21262d] rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-5 h-5 text-blue-400" />
                                      <div>
                                        <p className="text-sm text-white font-medium">{app.resume.name}</p>
                                        {app.resume.atsScore && <p className="text-xs text-slate-400">ATS Score: {app.resume.atsScore}</p>}
                                      </div>
                                    </div>
                                    <Link href={app.resume.url} target="_blank" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View Resume</Link>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Cover Letter</h4>
                              <div className="bg-[#161b22] p-4 rounded-lg border border-[#21262d] text-sm text-slate-300 h-full min-h-32 whitespace-pre-wrap">
                                {app.coverLetter ? app.coverLetter : <span className="text-slate-500 italic">No cover letter provided.</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {interviewModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#30363d]">
                <h2 className="text-lg font-semibold text-white">Schedule Interview</h2>
                <button onClick={() => setInterviewModal({ isOpen: false, appId: null })} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleScheduleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Date</label>
                    <input type="date" required value={interviewForm.date} onChange={e => setInterviewForm(f => ({...f, date: e.target.value}))} className="input-dark w-full text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Time</label>
                    <input type="time" required value={interviewForm.time} onChange={e => setInterviewForm(f => ({...f, time: e.target.value}))} className="input-dark w-full text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Duration (mins)</label>
                    <select value={interviewForm.duration} onChange={e => setInterviewForm(f => ({...f, duration: Number(e.target.value)}))} className="input-dark w-full text-sm">
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="90">1.5 Hours</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Type</label>
                    <select value={interviewForm.type} onChange={e => setInterviewForm(f => ({...f, type: e.target.value}))} className="input-dark w-full text-sm">
                      <option value="Video">Video Call</option>
                      <option value="Phone">Phone Call</option>
                      <option value="In-person">In Person</option>
                    </select>
                  </div>
                </div>

                {(interviewForm.type === "Video" || interviewForm.type === "Phone") && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5"/> {interviewForm.type === "Video" ? "Meeting URL" : "Phone Number"}
                    </label>
                    <input type="text" placeholder={interviewForm.type === "Video" ? "https://meet.google.com/..." : "+1 234 567 8900"} 
                      value={interviewForm.meetingUrl} onChange={e => setInterviewForm(f => ({...f, meetingUrl: e.target.value}))} 
                      className="input-dark w-full text-sm" />
                  </div>
                )}
                
                {interviewForm.type === "In-person" && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Location / Address</label>
                    <input type="text" placeholder="123 Main St, Office 4B..." 
                      value={interviewForm.meetingUrl} onChange={e => setInterviewForm(f => ({...f, meetingUrl: e.target.value}))} 
                      className="input-dark w-full text-sm" />
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setInterviewModal({ isOpen: false, appId: null })} className="btn-secondary py-2">Cancel</button>
                  <button type="submit" disabled={isScheduling} className="btn-primary py-2 min-w-24">
                    {isScheduling ? "Scheduling..." : "Schedule"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
