"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Calendar, Video, Clock, MapPin, Building2, User, Phone } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";

async function fetchInterviews() {
  const res = await fetch("/api/interviews");
  if (!res.ok) throw new Error("Failed to load interviews");
  return res.json().then(j => j.data?.interviews || []);
}

export default function InterviewsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isEmployer = userRole === "EMPLOYER";

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: fetchInterviews,
  });

  return (
    <div className="page-container">
      <Sidebar />
      <div className="main-content">
        <TopBar title="Interviews" subtitle={isEmployer ? "Interviews scheduled with candidates" : "Your upcoming and past interviews"} />
        <div className="content-area max-w-5xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
            </div>
          ) : interviews.length === 0 ? (
            <div className="card-dark p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 mb-4">
                <Calendar className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-white text-lg font-semibold mb-2">No interviews scheduled</h2>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {isEmployer 
                  ? "You haven't scheduled any interviews yet. Go to your applicants page to schedule one."
                  : "When an employer schedules an interview with you, it'll show up here with the date, time, and meeting link."}
              </p>
              {isEmployer ? (
                <Link href="/applicants" className="btn-primary inline-flex mt-4">View Applicants</Link>
              ) : (
                <Link href="/applications" className="btn-primary inline-flex mt-4">View my applications</Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((interview: any, i: number) => {
                const date = new Date(interview.scheduledAt);
                const isPast = date < new Date();
                
                return (
                  <motion.div 
                    key={interview.id}
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    className={`card-dark p-5 border-l-4 ${isPast ? 'border-l-slate-600 opacity-75' : 'border-l-blue-500'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{interview.job?.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                          {isEmployer ? (
                            <><User className="w-4 h-4"/> <span>{interview.candidate?.name}</span></>
                          ) : (
                            <><Building2 className="w-4 h-4"/> <span>{interview.job?.company?.name}</span></>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-400 font-bold">{format(date, "MMM d")}</div>
                        <div className="text-slate-400 text-sm">{format(date, "h:mm a")}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 p-3 bg-[#161b22] rounded-lg border border-[#21262d]">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>Duration: {interview.duration} mins</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        {interview.type === "Video" ? <Video className="w-4 h-4 text-slate-500" /> : 
                         interview.type === "Phone" ? <Phone className="w-4 h-4 text-slate-500" /> : 
                         <MapPin className="w-4 h-4 text-slate-500" />}
                        <span>{interview.type}</span>
                      </div>
                      {interview.meetingUrl && (
                        <div className="flex items-start gap-2 text-sm text-slate-300">
                          <Link href={interview.meetingUrl} target="_blank" className="text-blue-400 hover:text-blue-300 truncate max-w-[250px]">
                            {interview.meetingUrl}
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    {!isPast && (
                      <div className="flex justify-end">
                        {interview.meetingUrl && interview.type === "Video" ? (
                          <Link href={interview.meetingUrl} target="_blank" className="btn-primary py-2 text-sm px-4">
                            Join Meeting
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Waiting for interview time...</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
