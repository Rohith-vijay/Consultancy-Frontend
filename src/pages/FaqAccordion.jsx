import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, pageTransition, sectionVariants } from "../constants/motionVariants";
import { Typography, TextField, Accordion, AccordionSummary, AccordionDetails, Box, Chip } from "@mui/material";
import { updatePageSEO } from "../utils";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import SiteContainer from "../components/SiteContainer";

const faqs = [
  {
    category: "General",
    q: "What is the mission of K.V.G. Shanmuka Sai Charitable Trust?",
    a: "Our core mission focuses on Education, Environmental Conservation, Animal Welfare, and Health & Community Welfare. We provide free tuition support to children, plant and maintain native trees, and make clean drinking water accessible to rural communities in Harischandrapuram, Guntur district, Andhra Pradesh.",
  },
  {
    category: "Donations",
    q: "How secure are donations on this platform?",
    a: "Extremely secure. All payment handshakes are cryptographically verified end-to-end. We integrate with Razorpay using HMAC-SHA256 signatures, ensuring complete data security and automatic audit logs.",
  },
  {
    category: "Volunteering",
    q: "How can I register as a volunteer?",
    a: "Simply sign up with a Volunteer role, click 'Volunteer with Us', select the campaign that matches your schedule, specify your skills, and click submit. Administrators will review and approve applications.",
  },
  {
    category: "Donations",
    q: "Can I receive tax benefits for my donations?",
    a: "Every transaction issues a secure donation receipt. Please note: K.V.G. Shanmuka Sai Charitable Trust's applicable tax registration/approval is currently under process. No tax benefit or deduction is being promised at this time.",
  },
  {
    category: "Volunteering",
    q: "Are volunteer roles certified?",
    a: "The trust administrator can issue a volunteer recognition certificate for your service. It appears in your volunteer account only after it has been issued, and you can download it as a PDF.",
  },
  {
    category: "General",
    q: "Where is the trust's head office located?",
    a: "Our registered head office is located at 49a, Harischandrapuram, Thullur mandal, Guntur district, Andhra Pradesh, India.",
  },
];

function FaqAccordion() {
  useEffect(() => {
    updatePageSEO("FAQ & Support", "Find answers to frequently asked questions about donations, volunteering, and operations of K.V.G. Shanmuka Sai Charitable Trust.", "/faq");
  }, []);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expanded, setExpanded] = useState(false);

  const categories = ["ALL", "GENERAL", "DONATIONS", "VOLUNTEERING"];

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredFaqs = React.useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.q.toLowerCase().includes(search.toLowerCase()) ||
        faq.a.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || faq.category.toUpperCase() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="bg-gray-50/50 min-h-screen py-12 md:py-24"
    >
      <SiteContainer>
        {/* Title */}
        <motion.section
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto px-4 sm:px-6 mb-6 md:mb-12"
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              color: "primary.main",
              mb: 3,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
            }}
          >
            Organizational FAQ
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ fontSize: "1.15rem", maxWidth: 700, mx: "auto", lineHeight: 1.6 }}
          >
            Have questions about campaigns, tax benefits, volunteer guidelines, or payment safety? Explore answers below.
          </Typography>
        </motion.section>

        {/* Search & Categories Box */}
        <div className="max-w-3xl mx-auto px-4 mb-6 md:mb-10 space-y-6">
          <TextField
            fullWidth
            placeholder="Search FAQs (e.g. tax, cert, razorpay)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.disabled", mr: 1 }} />,
              sx: { borderRadius: 4, bgcolor: "white" },
            }}
          />

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                onClick={() => setSelectedCategory(cat)}
                color={selectedCategory === cat ? "primary" : "default"}
                sx={{
                  fontWeight: 750,
                  fontSize: "0.7rem",
                  px: 1.2,
                  py: 1.8,
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* FAQs List Accordion */}
        <div className="max-w-3xl mx-auto px-4">
          <AnimatePresence mode="popLayout">
            {filteredFaqs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-10 bg-white border border-dashed rounded-3xl"
              >
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                  No matches found for your query. Try different terms.
                </Typography>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq, idx) => {
                  const panelId = `panel-${idx}`;
                  return (
                    <motion.div
                      layout
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Accordion
                        expanded={expanded === panelId}
                        onChange={handleAccordionChange(panelId)}
                        elevation={0}
                        sx={{
                          borderRadius: 4,
                          border: "1px solid rgba(0,0,0,0.04)",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                          overflow: "hidden",
                          "&::before": { display: "none" },
                          "&.Mui-expanded": {
                            boxShadow: "0 10px 30px rgba(176,122,63,0.06)",
                            borderColor: "rgba(176,122,63,0.15)",
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}
                          sx={{
                            p: 2.5,
                            bgcolor: expanded === panelId ? "primary.50/30" : "white",
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1.4 }}
                          >
                            {faq.q}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 4, bgcolor: "white", borderTop: "1px solid #f9f9f9" }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ lineHeight: 1.7, fontSize: "0.95rem" }}
                          >
                            {faq.a}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </SiteContainer>
    </motion.div>
  );
}

export default FaqAccordion;
