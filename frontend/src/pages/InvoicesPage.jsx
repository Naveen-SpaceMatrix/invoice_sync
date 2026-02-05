import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const statusConfig = {
    not_updated: { label: "Not Updated", class: "badge-pending" },
    matched: { label: "Matched", class: "badge-success" },
    downloaded: { label: "Downloaded", class: "badge-success" },
    not_matched: { label: "Not Matched", class: "badge-error" }
  };

  const config = statusConfig[status] || statusConfig.not_updated;

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${config.class}`}>
      {config.label}
    </span>
  );
};

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`${API}/invoices`, {
          withCredentials: true
        });
        setInvoices(response.data);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.email_subject && invoice.email_subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="invoices-page">
      {/* Header */}
      <div>
        <h1 className="font-['IBM_Plex_Sans'] font-bold text-2xl text-white mb-1">Invoices</h1>
        <p className="text-[#A1A1AA] text-sm">All invoices from your Google Sheet</p>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="invoice-search-input"
            className="pl-10 bg-[#121212] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#FF5E00]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger 
            className="w-full sm:w-48 bg-[#121212] border-[#27272A] text-white"
            data-testid="status-filter-select"
          >
            <Filter className="w-4 h-4 mr-2 text-[#52525B]" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-[#121212] border-[#27272A]">
            <SelectItem value="all" className="text-white hover:bg-[#1E1E1E]">All Status</SelectItem>
            <SelectItem value="not_updated" className="text-white hover:bg-[#1E1E1E]">Not Updated</SelectItem>
            <SelectItem value="matched" className="text-white hover:bg-[#1E1E1E]">Matched</SelectItem>
            <SelectItem value="downloaded" className="text-white hover:bg-[#1E1E1E]">Downloaded</SelectItem>
            <SelectItem value="not_matched" className="text-white hover:bg-[#1E1E1E]">Not Matched</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-[#121212] border-[#27272A]">
          <CardHeader className="pb-4">
            <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF5E00]" />
              Invoice List
              <span className="text-sm font-normal text-[#52525B] ml-2">
                ({filteredInvoices.length} invoices)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#27272A]">
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Invoice #</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Email Subject</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">From</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Attachment</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Drive Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice, index) => (
                      <motion.tr
                        key={invoice.invoice_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="border-b border-[#27272A]/50 hover:bg-[#1E1E1E] transition-colors"
                        data-testid={`invoice-row-${index}`}
                      >
                        <td className="py-4 px-4 font-['JetBrains_Mono'] text-sm text-[#FF5E00]">
                          {invoice.invoice_number}
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-4 px-4 text-sm text-[#A1A1AA] max-w-xs truncate">
                          {invoice.email_subject || "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-[#52525B]">
                          {invoice.email_from || "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-white">
                          {invoice.attachment_name || "-"}
                        </td>
                        <td className="py-4 px-4">
                          {invoice.drive_link ? (
                            <a
                              href={invoice.drive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF5E00] hover:text-[#FF5E00]/80 text-sm underline underline-offset-2"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-[#27272A]">-</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
                <p className="text-[#52525B] text-sm">No invoices found</p>
                <p className="text-[#27272A] text-xs mt-1">
                  {invoices.length === 0 
                    ? "Run the workflow to import invoices from Google Sheets"
                    : "Try adjusting your filters"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InvoicesPage;
