import { useCallback, useEffect, useState } from "react";
import certificateService from "../services/certificateService";

export default function IssuedCertificates({ type }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setCertificates(await certificateService.mine()); }
    catch (err) { setError(err.message || "Unable to load certificates."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    load();
    // An award issued while this account is open appears when the user returns to the tab.
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  const download = async (certificate) => {
    setDownloading(certificate.id); setError("");
    try { await certificateService.download(certificate); }
    catch { setError("Unable to download this certificate. Please try again."); }
    finally { setDownloading(null); }
  };
  const visible = certificates.filter(certificate => !type || certificate.type === type);
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 sm:p-8" aria-label="Issued certificates">
      <div className="flex justify-between items-start gap-4 mb-5">
        <div><h2 className="text-xl font-bold text-slate-900">Recognition certificates</h2>
          <p className="text-sm text-slate-600 mt-1">Certificates appear here only after the trust administrator issues them.</p></div>
        <button onClick={load} disabled={loading} className="text-sm font-semibold text-amber-800 disabled:opacity-50">Refresh certificates</button>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {loading ? <p role="status" className="text-sm text-slate-600">Loading certificates...</p> : !visible.length ?
        <p className="rounded-2xl bg-white border border-amber-100 p-6 text-sm text-slate-600">No recognition certificates have been issued to your account yet.</p> :
        <div className="grid md:grid-cols-2 gap-4">{visible.map(certificate => (
          <article key={certificate.id} className="rounded-2xl bg-white border border-amber-200 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider font-bold text-amber-800">{certificate.type === "DONOR" ? "Donor appreciation" : "Volunteer recognition"}</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-2">{certificate.recipientName}</h3>
            <p className="text-sm text-slate-600 mt-2 break-words">{certificate.details}</p>
            {certificate.serviceFrom && <p className="text-sm text-slate-600 mt-1">Service: {certificate.serviceFrom} to {certificate.serviceTo}</p>}
            <p className="text-xs text-slate-500 mt-3">Issued {new Date(certificate.issuedAt).toLocaleDateString("en-IN")}</p>
            <p className="text-xs font-mono text-slate-500 break-all mt-1">{certificate.certificateNumber}</p>
            <button onClick={() => download(certificate)} disabled={downloading === certificate.id} className="mt-4 rounded-xl bg-amber-800 text-white font-bold text-sm px-4 py-2 disabled:opacity-50">{downloading === certificate.id ? "Downloading..." : "Download certificate PDF"}</button>
          </article>
        ))}</div>}
    </section>
  );
}
