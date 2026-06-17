"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { User, Briefcase, GraduationCap, Code2, FolderOpen, Edit2, Save, X, Plus, Globe, Linkedin, Github, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "skills", label: "Skills", icon: Code2 },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "projects", label: "Projects", icon: FolderOpen },
];

async function fetchProfile() {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed");
  return res.json().then((j) => j.data);
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { register, handleSubmit } = useForm();
  
  const profile = data?.profile;
  const user = data?.user;

  // --- Mutations ---
  const { mutate: saveProfile } = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { toast.success("Profile updated!"); setEditing(false); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
    onError: () => toast.error("Update failed"),
  });

  const { mutate: addSkill } = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch("/api/profile/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, yearsExp: Number(formData.yearsExp) }) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { toast.success("Skill added!"); setActiveModal(null); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const { mutate: addExperience } = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch("/api/profile/experiences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, isCurrent: formData.isCurrent === "true" }) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { toast.success("Experience added!"); setActiveModal(null); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const { mutate: addEducation } = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch("/api/profile/educations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, isCurrent: formData.isCurrent === "true" }) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { toast.success("Education added!"); setActiveModal(null); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const { mutate: addProject } = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch("/api/profile/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, technologies: formData.technologies.split(",").map((t:string)=>t.trim()) }) });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { toast.success("Project added!"); setActiveModal(null); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const { mutate: deleteItem } = useMutation({
    mutationFn: async ({ type, id }: { type: string, id: string }) => {
      const res = await fetch(`/api/profile/${type}?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { toast.success("Item removed!"); queryClient.invalidateQueries({ queryKey: ["profile"] }); },
  });

  // --- Modals ---
  const ModalWrapper = ({ title, children, onSubmit }: any) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0d1117] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 relative">
        <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <div className="flex justify-end pt-4"><button type="submit" className="btn-primary">Save</button></div>
        </form>
      </motion.div>
    </div>
  );

  const strength = profile?.profileStrength || 0;
  const strengthColor = strength >= 80 ? "text-green-400" : strength >= 50 ? "text-blue-400" : "text-yellow-400";

  return (
    <div className="page-container">
      <Sidebar role="JOB_SEEKER" />
      <div className="main-content">
        <TopBar title="My Profile" subtitle="Complete your profile to get better matches" />
        <div className="content-area">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-dark p-6 mb-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-blue-600/30 border-2 border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-2xl flex-shrink-0">
                  {user?.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-white font-bold text-xl">{user?.name || "Your Name"}</h2>
                      <p className="text-slate-400">{profile?.headline || "Add a headline"}</p>
                      {profile?.location && <p className="text-slate-500 text-sm mt-1">📍 {profile.location}</p>}
                    </div>
                    <button onClick={() => setEditing(!editing)} className={editing ? "btn-secondary flex items-center gap-1.5 text-sm" : "btn-primary flex items-center gap-1.5 text-sm"}>
                      {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5 text-xs"><span className="text-slate-400">Profile Strength</span><span className={`font-bold ${strengthColor}`}>{strength}%</span></div>
                    <div className="h-2 bg-[#21262d] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${strength >= 80 ? "bg-green-500" : strength >= 50 ? "bg-blue-500" : "bg-yellow-500"}`} style={{ width: `${strength}%` }} /></div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    {profile?.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400"><Linkedin className="w-4 h-4" /></a>}
                    {profile?.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white"><Github className="w-4 h-4" /></a>}
                    {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-400"><Globe className="w-4 h-4" /></a>}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Edit Form (Overview) */}
            {editing && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card-dark p-6 mb-6 border border-blue-500/20">
                <h3 className="text-white font-semibold mb-5">Edit Profile Information</h3>
                <form onSubmit={handleSubmit((d) => saveProfile(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><label className="block text-sm text-slate-300 mb-1.5">Full Name</label><input {...register("name")} defaultValue={user?.name || ""} className="input-dark" /></div>
                  <div className="sm:col-span-2"><label className="block text-sm text-slate-300 mb-1.5">Headline</label><input {...register("headline")} defaultValue={profile?.headline || ""} className="input-dark" /></div>
                  <div className="sm:col-span-2"><label className="block text-sm text-slate-300 mb-1.5">Bio</label><textarea {...register("bio")} defaultValue={profile?.bio || ""} rows={3} className="input-dark resize-none" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Phone</label><input {...register("phone")} defaultValue={profile?.phone || ""} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Location</label><input {...register("location")} defaultValue={profile?.location || ""} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">LinkedIn</label><input {...register("linkedinUrl")} defaultValue={profile?.linkedinUrl || ""} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">GitHub</label><input {...register("githubUrl")} defaultValue={profile?.githubUrl || ""} className="input-dark" /></div>
                  <div className="sm:col-span-2 flex justify-end"><button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save</button></div>
                </form>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-shrink-0 ${activeTab === tab.id ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white"}`}>
                  <tab.icon className="w-4 h-4" />{tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {isLoading ? (
              <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeTab === "overview" && (
                  <div className="card-dark p-6">
                    <h3 className="text-white font-semibold mb-4">About</h3>
                    <p className="text-slate-400 leading-relaxed">{profile?.bio || "No bio added yet."}</p>
                  </div>
                )}

                {activeTab === "skills" && (
                  <div className="card-dark p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold">Technical Skills</h3>
                      <button onClick={() => setActiveModal("skill")} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Skill</button>
                    </div>
                    {profile?.skills?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profile.skills.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-[#21262d] rounded-xl border border-[#30363d] group">
                            <div>
                              <div className="text-white text-sm font-medium">{s.skill.name}</div>
                              <div className="text-slate-500 text-xs">{s.level} • {s.yearsExp} yrs</div>
                            </div>
                            <button onClick={() => deleteItem({ type: "skills", id: s.id })} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-400/10 rounded-md"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-400 text-sm py-4">No skills added.</p>}
                  </div>
                )}

                {activeTab === "experience" && (
                  <div className="card-dark p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold">Work Experience</h3>
                      <button onClick={() => setActiveModal("experience")} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Experience</button>
                    </div>
                    {profile?.experiences?.length > 0 ? (
                      <div className="space-y-5">
                        {profile.experiences.map((exp: any) => (
                          <div key={exp.id} className="flex gap-4 pb-5 border-b border-[#21262d] last:border-0 relative group">
                            <button onClick={() => deleteItem({ type: "experiences", id: exp.id })} className="absolute top-0 right-0 text-red-400 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-400/10 rounded-md"><Trash2 className="w-4 h-4" /></button>
                            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0"><Briefcase className="w-5 h-5 text-blue-400" /></div>
                            <div>
                              <h4 className="text-white font-semibold">{exp.title}</h4>
                              <p className="text-slate-400 text-sm">{exp.company} {exp.location && `• ${exp.location}`}</p>
                              <p className="text-slate-500 text-xs mt-1">{new Date(exp.startDate).getFullYear()} – {exp.isCurrent ? "Present" : exp.endDate ? new Date(exp.endDate).getFullYear() : ""}</p>
                              {exp.description && <p className="text-slate-300 text-sm mt-2 leading-relaxed">{exp.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-400 text-sm py-4">No experience added yet.</p>}
                  </div>
                )}

                {activeTab === "education" && (
                  <div className="card-dark p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold">Education</h3>
                      <button onClick={() => setActiveModal("education")} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Education</button>
                    </div>
                    {profile?.educations?.length > 0 ? (
                      <div className="space-y-5">
                        {profile.educations.map((edu: any) => (
                          <div key={edu.id} className="flex gap-4 relative group">
                            <button onClick={() => deleteItem({ type: "educations", id: edu.id })} className="absolute top-0 right-0 text-red-400 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-400/10 rounded-md"><Trash2 className="w-4 h-4" /></button>
                            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0"><GraduationCap className="w-5 h-5 text-purple-400" /></div>
                            <div>
                              <h4 className="text-white font-semibold">{edu.degree}</h4>
                              <p className="text-slate-400 text-sm">{edu.institution}</p>
                              <p className="text-slate-500 text-xs mt-1">{new Date(edu.startDate).getFullYear()} – {edu.isCurrent ? "Present" : edu.endDate ? new Date(edu.endDate).getFullYear() : ""}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-400 text-sm py-4">No education added yet.</p>}
                  </div>
                )}

                {activeTab === "projects" && (
                  <div className="card-dark p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-semibold">Projects</h3>
                      <button onClick={() => setActiveModal("project")} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Project</button>
                    </div>
                    {profile?.projects?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile.projects.map((project: any) => (
                          <div key={project.id} className="p-4 bg-[#21262d] rounded-xl relative group border border-[#30363d]">
                            <button onClick={() => deleteItem({ type: "projects", id: project.id })} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-400/10 rounded-md"><Trash2 className="w-4 h-4" /></button>
                            <h4 className="text-white font-semibold mb-1 pr-8">{project.name}</h4>
                            {project.description && <p className="text-slate-400 text-xs mb-3">{project.description}</p>}
                            <div className="flex flex-wrap gap-1.5">
                              {project.technologies.map((t: string) => <span key={t} className="badge bg-[#30363d] text-slate-400 text-xs">{t}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-slate-400 text-sm py-4">No projects added yet.</p>}
                  </div>
                )}
              </motion.div>
            )}

            {/* Modals */}
            <AnimatePresence>
              {activeModal === "skill" && (
                <ModalWrapper title="Add Skill" onSubmit={handleSubmit((d) => addSkill(d))}>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Skill Name</label><input {...register("name", { required: true })} className="input-dark" placeholder="e.g. React" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Level</label><select {...register("level")} className="input-dark"><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option><option value="Expert">Expert</option></select></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Years of Experience</label><input type="number" {...register("yearsExp")} className="input-dark" defaultValue={1} /></div>
                </ModalWrapper>
              )}
              {activeModal === "experience" && (
                <ModalWrapper title="Add Experience" onSubmit={handleSubmit((d) => addExperience(d))}>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Job Title</label><input {...register("title", { required: true })} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Company</label><input {...register("company", { required: true })} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Location</label><input {...register("location")} className="input-dark" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm text-slate-300 mb-1.5">Start Date</label><input type="date" {...register("startDate", { required: true })} className="input-dark" /></div>
                    <div><label className="block text-sm text-slate-300 mb-1.5">End Date</label><input type="date" {...register("endDate")} className="input-dark" /></div>
                  </div>
                  <div className="flex items-center gap-2 mt-2"><input type="checkbox" value="true" {...register("isCurrent")} className="rounded border-slate-600 bg-transparent" /><label className="text-sm text-slate-300">I currently work here</label></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5 mt-2">Description</label><textarea {...register("description")} className="input-dark resize-none" rows={3} /></div>
                </ModalWrapper>
              )}
              {activeModal === "education" && (
                <ModalWrapper title="Add Education" onSubmit={handleSubmit((d) => addEducation(d))}>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Institution</label><input {...register("institution", { required: true })} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Degree</label><input {...register("degree", { required: true })} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Field of Study</label><input {...register("fieldOfStudy")} className="input-dark" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm text-slate-300 mb-1.5">Start Date</label><input type="date" {...register("startDate", { required: true })} className="input-dark" /></div>
                    <div><label className="block text-sm text-slate-300 mb-1.5">End Date</label><input type="date" {...register("endDate")} className="input-dark" /></div>
                  </div>
                  <div className="flex items-center gap-2 mt-2"><input type="checkbox" value="true" {...register("isCurrent")} className="rounded border-slate-600 bg-transparent" /><label className="text-sm text-slate-300">I currently study here</label></div>
                </ModalWrapper>
              )}
              {activeModal === "project" && (
                <ModalWrapper title="Add Project" onSubmit={handleSubmit((d) => addProject(d))}>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Project Name</label><input {...register("name", { required: true })} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Project URL</label><input {...register("url")} className="input-dark" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5">Technologies (comma separated)</label><input {...register("technologies")} className="input-dark" placeholder="React, Node, Tailwind" /></div>
                  <div><label className="block text-sm text-slate-300 mb-1.5 mt-2">Description</label><textarea {...register("description")} className="input-dark resize-none" rows={3} /></div>
                </ModalWrapper>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
