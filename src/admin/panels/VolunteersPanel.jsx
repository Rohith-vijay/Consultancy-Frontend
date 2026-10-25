import React, { useState } from "react";
import databaseService from "../../services/databaseService";
import { motion, AnimatePresence } from "framer-motion";
import { assignVolunteerRole, verifyVolunteerAttendance } from "../../services/messageService";
import CertificateIssueButton from "../components/CertificateIssueButton";

const VolunteersPanel = ({ volunteerApps, onApproveVolunteer, onRejectVolunteer, formatDate, EmptyState, onRefresh }) => {


  return (
    <div className="pb-12">
      <h3 className="text-lg font-bold text-brand-navy-dark mb-4">Volunteer Applications</h3>
      {!Array.isArray(volunteerApps) || volunteerApps.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No volunteer applications yet."
          subtitle="Applications from the volunteer page will appear here."
        />
      ) : (
        <div className="space-y-4">
          {Array.isArray(volunteerApps) && volunteerApps.map((app) => {


            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={app.id}
                className="border border-gray-100 rounded-3xl p-5 bg-white hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h4 className="font-bold text-brand-navy-dark">
                        {app.name || app.userFullName || `User #${app.userId}`}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {app.email}
                        {app.phone && <span className="mx-2">•</span>}
                        {app.phone}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {app.eventTitle && (
                        <div className="inline-block bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-primary/20">
                          Target: {app.eventTitle}
                        </div>
                      )}
                      
                      {app.interest && (
                        <div className="inline-block bg-gray-50 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full border border-gray-200">
                          Focus: {app.interest}
                        </div>
                      )}
                    </div>

                    {app.message && (
                      <p className="text-xs text-gray-600 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-50 italic leading-relaxed">
                        "{app.message}"
                      </p>
                    )}



                    {/* Management Controls for Approved Volunteers */}
                    {(app.status === "approved" || app.status === "APPROVED") && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-xs">
                        <div className="font-bold text-slate-700 flex items-center gap-1">
                          <span>🛠️</span> Placements & Hours Management
                        </div>
                        
                        {/* Assign Role */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 w-24">Assign Role:</span>
                          <input 
                            type="text" 
                            defaultValue={app.assignedRole || ""} 
                            placeholder="e.g. Lead Coordinator"
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs w-48 focus:ring-1 focus:ring-primary focus:outline-none"
                            onBlur={async (e) => {
                              const val = e.target.value;
                              if (val !== (app.assignedRole || "")) {
                                try {
                                  await assignVolunteerRole(app.id, val);
                                  onRefresh();
                                } catch (err) {
                                  alert("Failed to assign role");
                                }
                              }
                            }}
                          />
                        </div>

                        {/* Attendance Logs */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 w-24">Logs:</span>
                          <span className="text-[10px] text-slate-500">
                            {app.checkInTime ? `Check-in: ${new Date(app.checkInTime).toLocaleString()}` : "Not checked in yet"}
                            {app.checkOutTime && ` | Check-out: ${new Date(app.checkOutTime).toLocaleString()}`}
                          </span>
                        </div>

                        {/* Hours & Verification */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500 w-24">Hours Logged:</span>
                            <input 
                              type="number" 
                              step="0.5"
                              defaultValue={app.hoursServed || 0}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs w-16 text-center font-bold"
                              id={`hours-${app.id}`}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {app.attendanceVerified ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const hours = parseFloat(document.getElementById(`hours-${app.id}`).value) || 0;
                                  try {
                                    await verifyVolunteerAttendance(app.id, hours, false);
                                    onRefresh();
                                  } catch (err) {
                                    alert("Failed to update verification");
                                  }
                                }}
                                className="text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-full border border-rose-150"
                              >
                                Revoke Verification
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  const hours = parseFloat(document.getElementById(`hours-${app.id}`).value) || 0;
                                  try {
                                    await verifyVolunteerAttendance(app.id, hours, true);
                                    onRefresh();
                                  } catch (err) {
                                    alert("Failed to verify attendance");
                                  }
                                }}
                                className="text-[10px] font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-150 shadow-sm"
                              >
                                Verify Attendance ✓
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 font-bold mt-2">
                      Applied on: {formatDate(app.createdAt || app.appliedAt)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                    <CertificateIssueButton type="VOLUNTEER" sourceId={app.id} name={app.name || app.userFullName}
                      activity={app.eventTitle || ""} eligible={app.status?.toUpperCase() === "APPROVED"}
                      ineligibleReason="Approve the application before issuing a certificate." />
                    {app.status === "pending" || app.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => onApproveVolunteer(app.id)}
                          className="text-xs bg-emerald-500 text-white font-bold px-4.5 py-2 rounded-full hover:bg-emerald-600 shadow-sm shadow-emerald-500/10 transition active:scale-95 select-none"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onRejectVolunteer(app.id)}
                          className="text-xs bg-rose-500 text-white font-bold px-4.5 py-2 rounded-full hover:bg-rose-600 shadow-sm shadow-rose-500/10 transition active:scale-95 select-none"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-xs px-4 py-2 rounded-full font-bold select-none shadow-sm ${
                          app.status === "approved" || app.status === "APPROVED"
                            ? "bg-green-50 text-green-700 border border-green-150 shadow-green-100/50"
                            : "bg-red-50 text-red-700 border border-red-150 shadow-red-100/50"
                        }`}
                      >
                        {app.status === "approved" || app.status === "APPROVED"
                          ? "✓ Approved"
                          : "✕ Rejected"}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VolunteersPanel;
