import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AttachmentsPage = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await axios.get(`${API}/attachments`, {
          withCredentials: true
        });
        setAttachments(response.data);
      } catch (error) {
        console.error("Failed to fetch attachments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, []);

  const filteredAttachments = attachments.filter(att =>
    att.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    att.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    att.email_subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attachments-page">
      {/* Header */}
      <div>
        <h1 className="font-['IBM_Plex_Sans'] font-bold text-2xl text-white mb-1">Attachments</h1>
        <p className="text-[#A1A1AA] text-sm">Downloaded invoice files saved to Google Drive</p>
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
            placeholder="Search attachments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="attachment-search-input"
            className="pl-10 bg-[#121212] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#FF5E00]"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="px-4 py-2 bg-[#121212] border border-[#27272A] rounded-md">
          <span className="text-[#52525B] text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider">Total Files</span>
          <p className="font-['JetBrains_Mono'] text-xl text-white">{attachments.length}</p>
        </div>
      </motion.div>

      {/* Attachments Grid */}
      {filteredAttachments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttachments.map((att, index) => (
            <motion.div
              key={att.attachment_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              data-testid={`attachment-card-${index}`}
            >
              <Card className="bg-[#121212] border-[#27272A] hover:border-[#FF5E00]/30 hover:bg-[#1E1E1E] transition-all duration-300 h-full">
                <CardContent className="p-5">
                  {/* File Icon & Invoice Number */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FF5E00]/10 border border-[#FF5E00]/20 rounded-md flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#FF5E00]" />
                      </div>
                      <div>
                        <p className="font-['JetBrains_Mono'] text-sm text-[#FF5E00]">
                          {att.invoice_number}
                        </p>
                        <p className="text-xs text-[#52525B]">
                          {new Date(att.downloaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filename */}
                  <p className="text-white text-sm mb-2 truncate" title={att.filename}>
                    {att.filename}
                  </p>

                  {/* Email Subject */}
                  <p className="text-[#A1A1AA] text-xs mb-4 line-clamp-2" title={att.email_subject}>
                    From: {att.email_subject}
                  </p>

                  {/* Action Button */}
                  {att.drive_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(att.drive_link, '_blank')}
                      className="w-full bg-transparent border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Drive
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-[#121212] border-[#27272A]">
            <CardContent className="py-12">
              <div className="text-center">
                <Download className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
                <p className="text-[#52525B] text-sm">No attachments found</p>
                <p className="text-[#27272A] text-xs mt-1">
                  {attachments.length === 0
                    ? "Run the workflow to download invoice attachments"
                    : "Try adjusting your search"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default AttachmentsPage;
