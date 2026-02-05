import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Mail, 
  Download, 
  PlayCircle, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon, title, value, subtitle, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className="bg-[#121212] border-[#27272A] hover:border-[#FF5E00]/30 hover:bg-[#1E1E1E] transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[#52525B] text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider mb-2">{title}</p>
            <p className={`font-['JetBrains_Mono'] text-3xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-[#A1A1AA] text-sm mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-md flex items-center justify-center ${color.replace('text-', 'bg-')}/10 border ${color.replace('text-', 'border-')}/20`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTriggerWorkflow = async () => {
    setTriggerLoading(true);
    try {
      await axios.post(`${API}/workflow/trigger`, {}, {
        withCredentials: true
      });
      // Refresh stats after triggering
      await fetchStats();
    } catch (error) {
      console.error("Failed to trigger workflow:", error);
      if (error.response?.status === 400) {
        navigate("/settings");
      }
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const invoiceStats = stats?.invoice_stats || { total: 0, not_updated: 0, matched: 0, downloaded: 0, not_matched: 0 };

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['IBM_Plex_Sans'] font-bold text-2xl text-white mb-1">Dashboard</h1>
          <p className="text-[#A1A1AA] text-sm">Invoice matching workflow overview</p>
        </div>
        <Button
          onClick={handleTriggerWorkflow}
          disabled={triggerLoading}
          data-testid="trigger-workflow-btn"
          className="bg-[#FF5E00] hover:bg-[#FF5E00]/90 text-white font-['IBM_Plex_Sans'] font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(255,94,0,0.3)]"
        >
          {triggerLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <PlayCircle className="w-5 h-5 mr-2" />
          )}
          Run Workflow
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5 text-white" />}
          title="Total Invoices"
          value={invoiceStats.total}
          color="text-white"
          delay={0}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-[#FFD600]" />}
          title="Not Updated"
          value={invoiceStats.not_updated}
          subtitle="Pending processing"
          color="text-[#FFD600]"
          delay={0.1}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-[#00FF94]" />}
          title="Downloaded"
          value={invoiceStats.downloaded}
          subtitle="Saved to Drive"
          color="text-[#00FF94]"
          delay={0.2}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-[#FF2A2A]" />}
          title="Not Matched"
          value={invoiceStats.not_matched}
          subtitle="No email found"
          color="text-[#FF2A2A]"
          delay={0.3}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="bg-[#121212] border-[#27272A]">
            <CardHeader className="pb-4">
              <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FF5E00]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate("/invoices")}
                data-testid="view-invoices-btn"
                className="w-full justify-start bg-transparent border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] text-white"
              >
                <FileText className="w-4 h-4 mr-3" />
                View All Invoices
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/email-scans")}
                data-testid="view-email-scans-btn"
                className="w-full justify-start bg-transparent border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] text-white"
              >
                <Mail className="w-4 h-4 mr-3" />
                Email Scan Results
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/attachments")}
                data-testid="view-attachments-btn"
                className="w-full justify-start bg-transparent border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] text-white"
              >
                <Download className="w-4 h-4 mr-3" />
                Downloaded Attachments
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/workflow")}
                data-testid="view-workflow-btn"
                className="w-full justify-start bg-transparent border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] text-white"
              >
                <PlayCircle className="w-4 h-4 mr-3" />
                Workflow Management
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Runs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="bg-[#121212] border-[#27272A]">
            <CardHeader className="pb-4">
              <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF5E00]" />
                Recent Workflow Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recent_runs && stats.recent_runs.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_runs.map((run, index) => (
                    <div 
                      key={run.run_id}
                      className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-[#27272A] rounded-md"
                      data-testid={`recent-run-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          run.status === 'completed' ? 'bg-[#00FF94]' : 
                          run.status === 'running' ? 'bg-[#FFD600]' : 'bg-[#FF2A2A]'
                        }`} />
                        <div>
                          <p className="font-['JetBrains_Mono'] text-xs text-[#A1A1AA]">
                            {run.run_id}
                          </p>
                          <p className="text-xs text-[#52525B]">
                            {new Date(run.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          run.status === 'completed' ? 'badge-success' : 
                          run.status === 'running' ? 'badge-pending' : 'badge-error'
                        }`}>
                          {run.status}
                        </span>
                        <p className="text-xs text-[#52525B] mt-1">
                          {run.attachments_downloaded} downloaded
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-[#27272A] mx-auto mb-3" />
                  <p className="text-[#52525B] text-sm">No workflow runs yet</p>
                  <p className="text-[#27272A] text-xs mt-1">Click "Run Workflow" to start</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Attachments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card className="bg-[#121212] border-[#27272A]">
          <CardHeader className="pb-4">
            <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-[#FF5E00]" />
              Recently Downloaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recent_attachments && stats.recent_attachments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#27272A]">
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Invoice #</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Filename</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Email Subject</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Downloaded</th>
                      <th className="text-left py-3 px-4 text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_attachments.map((att, index) => (
                      <tr 
                        key={att.attachment_id} 
                        className="border-b border-[#27272A]/50 hover:bg-[#1E1E1E] transition-colors"
                        data-testid={`attachment-row-${index}`}
                      >
                        <td className="py-3 px-4 font-['JetBrains_Mono'] text-sm text-[#FF5E00]">{att.invoice_number}</td>
                        <td className="py-3 px-4 text-sm text-white">{att.filename}</td>
                        <td className="py-3 px-4 text-sm text-[#A1A1AA] max-w-xs truncate">{att.email_subject}</td>
                        <td className="py-3 px-4 text-xs text-[#52525B]">{new Date(att.downloaded_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {att.drive_link && (
                            <a 
                              href={att.drive_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#FF5E00] hover:text-[#FF5E00]/80 text-sm"
                            >
                              View in Drive
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Download className="w-10 h-10 text-[#27272A] mx-auto mb-3" />
                <p className="text-[#52525B] text-sm">No attachments downloaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
