import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import databaseService from "../../services/databaseService";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReplayIcon from "@mui/icons-material/Replay";
import CertificateIssueButton from "../components/CertificateIssueButton";

// ─── Status Badge Helper ─────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-100",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    FAILED: "bg-rose-50 text-rose-700 border-rose-100",
    REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-bold inline-block border ${
        cfg[status] || "bg-slate-50 text-slate-600 border-slate-100"
      }`}
    >
      {status}
    </span>
  );
};

const DonationsPanel = ({
  donations,
  donationPage,
  totalDonationPages,
  tabLoading,
  onLoadDonations,
  formatDate,
  LoadingSpinner,
  EmptyState,
}) => {
  // Refund dialog state
  const [refundTarget, setRefundTarget] = useState(null); // donation object
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState("");

  // Local donations state for optimistic UI updates after refund
  const [localOverrides, setLocalOverrides] = useState({}); // { donationId: patchedFields }

  const openRefundDialog = (don) => {
    setRefundTarget(don);
    setRefundReason("");
    setRefundError("");
  };

  const closeRefundDialog = () => {
    if (refundLoading) return;
    setRefundTarget(null);
    setRefundReason("");
    setRefundError("");
  };

  const handleConfirmRefund = async () => {
    if (!refundReason.trim()) {
      setRefundError("Please provide a refund reason before proceeding.");
      return;
    }
    setRefundLoading(true);
    setRefundError("");
    try {
      await databaseService.refundDonation(refundTarget.id, refundReason.trim());

      // Optimistic update
      setLocalOverrides((prev) => ({
        ...prev,
        [refundTarget.id]: {
          status: "REFUNDED",
          refundDate: new Date().toISOString(),
          refundReason: refundReason.trim(),
        },
      }));

      closeRefundDialog();

      // Refresh the donations list from server
      if (onLoadDonations) {
        setTimeout(() => onLoadDonations(donationPage), 600);
      }

      // Success toast (if global toast system uses window event)
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { message: "Refund processed successfully.", type: "success" },
        })
      );
    } catch (err) {
      console.error("[DonationsPanel] Refund failed:", err);
      setRefundError(
        err?.response?.data?.message ||
          err?.message ||
          "Refund failed. Please try again."
      );
    } finally {
      setRefundLoading(false);
    }
  };

  // Merge server data with optimistic overrides
  const getEffectiveDon = (don) => ({
    ...don,
    ...(localOverrides[don.id] || {}),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <h3 className="text-lg font-bold text-brand-navy-dark">
          Donation Transactions
        </h3>
        <span className="text-xs font-bold bg-primary/10 text-primary px-3.5 py-1.5 rounded-full">
          Real-time Audit Ledger
        </span>
      </div>

      {tabLoading ? (
        <LoadingSpinner />
      ) : !Array.isArray(donations) || donations.length === 0 ? (
        <EmptyState
          icon="💰"
          title="No donations recorded."
          subtitle="Donation transaction history will appear here once received."
        />
      ) : (
        <div>
          <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-bold bg-gray-50/50">
                  <th className="py-4 px-5">ID / Receipt No</th>
                  <th className="py-4 px-5">Donor Particulars</th>
                  <th className="py-4 px-5">Donated Amount</th>
                  <th className="py-4 px-5">Correlation ID</th>
                  <th className="py-4 px-5">Gateway Status</th>
                  <th className="py-4 px-5">Transaction Date</th>
                  <th className="py-4 px-5">Refund Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((rawDon) => {
                  const don = getEffectiveDon(rawDon);
                  const canRefund =
                    don.status === "SUCCESS" && !don.refundDate;

                  return (
                    <motion.tr
                      key={don.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-brand-navy-dark">
                          #{don.id}
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                          {don.receiptNumber || "—"}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-brand-navy-dark">
                          {don.donorName || "Anonymous"}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {don.donorEmail || "no-email@trust.org"}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-black text-gray-900">
                        ₹{Number(don.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-5">
                        {don.correlationId ? (
                          <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {don.correlationId.substring(0, 14)}...
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs font-semibold">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={don.status} />
                      </td>
                      <td className="py-4 px-5 text-gray-500 font-medium">
                        {formatDate(don.createdAt)}
                      </td>
                      <td className="py-4 px-5">
                        {don.refundDate ? (
                          <div>
                            <div className="text-xs text-purple-700 font-bold">
                              {formatDate(don.refundDate)}
                            </div>
                            {don.refundReason && (
                              <div
                                className="text-[10px] text-gray-400 font-medium max-w-[120px] truncate"
                                title={don.refundReason}
                              >
                                {don.refundReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs font-semibold">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <CertificateIssueButton type="DONOR" sourceId={don.id} name={don.donorName}
                          activity={`INR ${Number(don.amount).toLocaleString("en-IN")}`}
                          eligible={don.status === "SUCCESS" && Boolean(don.userId)}
                          ineligibleReason={!don.userId ? "Requires a donation linked to a recipient account." : "Available for successful donations only."} />
                        {canRefund && (
                          <button
                            onClick={() => openRefundDialog(don)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all"
                          >
                            <ReplayIcon sx={{ fontSize: 13 }} />
                            Refund
                          </button>
                        )}
                        {don.status === "REFUNDED" && (
                          <span className="text-[10px] font-bold text-purple-500 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                            Refunded
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalDonationPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <button
                disabled={donationPage === 0 || tabLoading}
                onClick={() => onLoadDonations(donationPage - 1)}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition"
              >
                Previous Page
              </button>
              <span className="text-xs font-bold text-gray-500">
                Page {donationPage + 1} of {totalDonationPages}
              </span>
              <button
                disabled={donationPage >= totalDonationPages - 1 || tabLoading}
                onClick={() => onLoadDonations(donationPage + 1)}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition"
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── REFUND CONFIRMATION DIALOG ─── */}
      <AnimatePresence>
        {refundTarget && (
          <Dialog
            open={Boolean(refundTarget)}
            onClose={closeRefundDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 5,
                overflow: "hidden",
                boxShadow: "0 25px 60px -12px rgba(0,0,0,0.3)",
              },
              component: motion.div,
              initial: { opacity: 0, scale: 0.94 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.94 },
            }}
          >
            {/* Dialog Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-5">
              <div className="flex items-center gap-3 mb-1">
                <WarningAmberIcon sx={{ fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1rem" }}>
                  Confirm Refund
                </Typography>
              </div>
              <Typography variant="caption" sx={{ opacity: 0.85, display: "block" }}>
                Donation #{refundTarget.id} — ₹{Number(refundTarget.amount).toLocaleString("en-IN")}
              </Typography>
            </div>

            <DialogContent sx={{ px: 3, pt: 3, pb: 2 }}>
              <Alert
                severity="error"
                icon={<WarningAmberIcon />}
                sx={{ borderRadius: 3, mb: 3, fontWeight: 700 }}
              >
                ⚠️ This action is{" "}
                <strong>IRREVERSIBLE</strong>. The donation will be
                permanently marked as{" "}
                <strong>REFUNDED</strong>.
              </Alert>

              <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Donor</span>
                  <span className="font-extrabold text-slate-800">{refundTarget.donorName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Amount</span>
                  <span className="font-extrabold text-slate-800 text-red-700">
                    ₹{Number(refundTarget.amount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-bold">Receipt</span>
                  <span className="font-mono font-extrabold text-slate-600">
                    {refundTarget.receiptNumber || "—"}
                  </span>
                </div>
              </div>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Refund Reason *"
                placeholder="e.g. Duplicate payment, donor request, event cancelled..."
                value={refundReason}
                onChange={(e) => {
                  setRefundReason(e.target.value);
                  if (refundError) setRefundError("");
                }}
                disabled={refundLoading}
                error={!!refundError}
                helperText={refundError || "Required — this will be logged in the audit trail."}
                InputProps={{ sx: { borderRadius: 3 } }}
              />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, flexDirection: "column" }}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                disabled={refundLoading || !refundReason.trim()}
                onClick={handleConfirmRefund}
                startIcon={
                  refundLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <ReplayIcon />
                  )
                }
                sx={{
                  py: 1.4,
                  borderRadius: 3,
                  fontWeight: 800,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  background: "linear-gradient(135deg, #dc2626, #e11d48)",
                  "&:hover": { background: "linear-gradient(135deg, #b91c1c, #be123c)" },
                }}
              >
                {refundLoading
                  ? "Processing Refund..."
                  : "Confirm Irreversible Refund"}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                disabled={refundLoading}
                onClick={closeRefundDialog}
                sx={{ py: 1.2, borderRadius: 3, fontWeight: 700, textTransform: "none" }}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DonationsPanel;
