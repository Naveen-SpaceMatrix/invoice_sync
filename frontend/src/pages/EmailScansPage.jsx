import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Paperclip, CheckCircle, XCircle, Search } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmailScansPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await axios.get(`${API}/email-scans`, {
          withCredentials: true
        });
        setScans(response.data);
      } catch (error) {
        console.error("Failed to fetch email scans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  const filteredScans = scans.filter(scan =>
    scan.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.extracted_invoice_numbers.some(num => 
      num.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="email-scans-page">
      {/* Header */}
      <div>
        <h1 className="font-['IBM_Plex_Sans'] font-bold text-2xl text-white mb-1">Email Scans</h1>
        <p className="text-[#A1A1AA] text-sm">Gmail messages scanned for invoice attachments</p>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <Input
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="email-search-input"
            className="pl-10 bg-[#121212] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#FF5E00]"
          />
        </div>
      </motion.div>

      {/* Terminal-style output */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-[#121212] border-[#27272A]">
          <CardHeader className="pb-4">
            <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF5E00]" />
              Scan Results
              <span className="text-sm font-normal text-[#52525B] ml-2">
                ({filteredScans.length} emails)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredScans.length > 0 ? (
              <div className="terminal-output max-h-[600px] overflow-y-auto">
                {filteredScans.map((scan, index) => (
                  <motion.div
                    key={scan.scan_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="mb-4 pb-4 border-b border-[#27272A]/50 last:border-0"
                    data-testid={`email-scan-${index}`}
                  >
                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-[#52525B] text-xs mb-2">
                      <span>[{scan.date}]</span>
                      <span className="log-info">SCAN</span>
                    </div>
                    
                    {/* Email Details */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-[#52525B] w-16 shrink-0">FROM:</span>
                        <span className="text-white">{scan.sender}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#52525B] w-16 shrink-0">SUBJECT:</span>
                        <span className="text-white">{scan.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#52525B] w-16 shrink-0">ATTACH:</span>
                        {scan.has_attachment ? (
                          <span className="flex items-center gap-1 log-success">
                            <Paperclip className="w-3 h-3" />
                            YES
                          </span>
                        ) : (
                          <span className="log-error">NO</span>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#52525B] w-16 shrink-0">INVOICES:</span>
                        {scan.extracted_invoice_numbers.length > 0 ? (
                          <span className="flex flex-wrap gap-2">
                            {scan.extracted_invoice_numbers.map((num, i) => (
                              <span key={i} className="log-invoice px-2 py-0.5 bg-[#FF5E00]/10 rounded">
                                {num}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-[#52525B]">None extracted</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Match Status */}
                    <div className="mt-3 flex items-center gap-2">
                      {scan.matched_invoice ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-[#00FF94]" />
                          <span className="log-success">
                            MATCHED: {scan.matched_invoice}
                          </span>
                        </>
                      ) : scan.extracted_invoice_numbers.length > 0 ? (
                        <>
                          <XCircle className="w-4 h-4 text-[#FF2A2A]" />
                          <span className="log-error">NO MATCH FOUND</span>
                        </>
                      ) : (
                        <span className="log-info">NO INVOICE NUMBER DETECTED</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
                <p className="text-[#52525B] text-sm">No email scans found</p>
                <p className="text-[#27272A] text-xs mt-1">
                  {scans.length === 0
                    ? "Run the workflow to scan emails for invoices"
                    : "Try adjusting your search"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex flex-wrap gap-6 text-xs"
      >
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00FF94]" />
          <span className="text-[#52525B]">Matched</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF2A2A]" />
          <span className="text-[#52525B]">No Match</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5E00]" />
          <span className="text-[#52525B]">Invoice Number</span>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailScansPage;
