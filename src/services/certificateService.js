import api from "./api";

const certificateService = {
  mine: async () => (await api.get("/certificates/mine")).data || [],
  forSource: async (type, sourceId) => (await api.get(`/certificates/source/${type}/${sourceId}`)).data,
  issue: async (request) => (await api.post("/certificates/issue", request)).data,
  download: async (certificate) => {
    const response = await api.get(`/certificates/${certificate.id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${certificate.certificateNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  },
};

export default certificateService;
