import { useEffect, useState } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import certificateService from "../../services/certificateService";

export default function CertificateIssueButton({ type, sourceId, name, activity = "", eligible = true, ineligibleReason = "" }) {
  const [certificate, setCertificate] = useState(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [serviceActivity, setServiceActivity] = useState(activity);
  const [serviceFrom, setServiceFrom] = useState("");
  const [serviceTo, setServiceTo] = useState("");
  useEffect(() => {
    let active = true;
    setChecking(true);
    setCertificate(null);
    certificateService.forSource(type, sourceId).then(value => { if (active) { setCertificate(value); setStatusError(""); } })
      .catch(() => { if (active) setStatusError("Certificate status unavailable. Reopen this panel to retry."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [type, sourceId]);
  const generate = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const issued = await certificateService.issue({ type, sourceId,
        ...(type === "VOLUNTEER" ? { activity: serviceActivity.trim(), serviceFrom, serviceTo } : {}) });
      setCertificate(issued); setOpen(false);
    } catch (err) { setError(err?.response?.data?.message || err.message || "Certificate could not be issued."); }
    finally { setBusy(false); }
  };
  const download = async () => {
    setBusy(true); setError("");
    try { await certificateService.download(certificate); }
    catch { setError("Unable to download the certificate. Please try again."); }
    finally { setBusy(false); }
  };
  const today = new Date().toLocaleDateString("en-CA");
  return <div className="mt-2">
    <button type="button" disabled={checking || busy || (!certificate && (!eligible || Boolean(statusError)))}
      title={statusError || (!certificate && !eligible ? ineligibleReason : "")}
      onClick={() => certificate ? download() : (setError(""), setOpen(true))}
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50">
      {checking ? "Checking certificate..." : busy ? "Please wait..." : certificate ? "Download issued certificate" : "Generate certificate"}
    </button>
    {certificate && <p className="text-xs text-emerald-700 mt-1">Issued {new Date(certificate.issuedAt).toLocaleDateString("en-IN")}</p>}
    {!certificate && !eligible && <p className="text-xs text-slate-500 mt-1 max-w-56">{ineligibleReason}</p>}
    {(statusError || (!open && error)) && <p role="alert" className="text-xs text-red-700 mt-1">{statusError || error}</p>}
    <Dialog open={open} onClose={() => !busy && setOpen(false)} maxWidth="sm" fullWidth>
      <form onSubmit={generate}>
        <DialogTitle>Issue {type === "DONOR" ? "donor appreciation" : "volunteer recognition"} certificate</DialogTitle>
        <DialogContent className="space-y-5">
          <p className="text-sm text-slate-600">Recipient: <strong>{name}</strong></p>
          <p className="text-sm text-slate-600">Generating this certificate will immediately add it to the recipient's account. It will include today's issue date and a unique certificate ID.</p>
          {type === "DONOR" ? <p className="text-sm text-amber-900">Contribution: {activity}. The name and contribution details are taken from this donation.</p> : <>
            <TextField required fullWidth label="Service / activity" value={serviceActivity} onChange={event => setServiceActivity(event.target.value)} slotProps={{htmlInput:{maxLength:400}}} />
            <div className="grid grid-cols-2 gap-4">
              <TextField required fullWidth type="date" label="Service start" slotProps={{inputLabel:{shrink:true},htmlInput:{max:today}}} value={serviceFrom} onChange={event => setServiceFrom(event.target.value)} />
              <TextField required fullWidth type="date" label="Service end" slotProps={{inputLabel:{shrink:true},htmlInput:{min:serviceFrom || undefined,max:today}}} value={serviceTo} onChange={event => setServiceTo(event.target.value)} />
            </div>
          </>}
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={16} /> : undefined}>Generate and issue</Button></DialogActions>
      </form>
    </Dialog>
  </div>;
}
