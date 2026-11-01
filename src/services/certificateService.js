import api from "./api";
import { certificateDownloadError } from "../utils/certificateDownload";

const certificateService = {
  mine: async () => (await api.get("/certificates/mine")).data || [],
  forSource: async (type, sourceId) => (await api.get(`/certificates/source/${type}/${sourceId}`)).data,
  issue: async (request) => (await api.post("/certificates/issue", request)).data,
  download: async (certificate) => {
    let response;
    try { response = await api.get(`/certificates/${certificate.id}/pdf`, { responseType: "blob" }); }
    catch (error) { throw new Error(await certificateDownloadError(error), { cause: error }); }
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    try {
      link.href = url;
      link.download = `${certificate.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
    } finally {
      // Release the temporary node and blob even if the browser blocks the download.
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  },
};

export default certificateService;
