import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  PlayCircle, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle,
  Copy,
  Check
} from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WorkflowPage = () => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [n8nJson, setN8nJson] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchRuns = async () => {
    try {
      const response = await axios.get(`${API}/workflow/runs`, {
        withCredentials: true
      });
      setRuns(response.data);
    } catch (error) {
      console.error("Failed to fetch workflow runs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchN8nJson = async () => {
    try {
      const response = await axios.get(`${API}/workflow/n8n-json`, {
        withCredentials: true
      });
      setN8nJson(response.data);
    } catch (error) {
      console.error("Failed to fetch n8n JSON:", error);
    }
  };

  useEffect(() => {
    fetchRuns();
    fetchN8nJson();
  }, []);

  const handleTriggerWorkflow = async () => {
    setTriggerLoading(true);
    try {
      await axios.post(`${API}/workflow/trigger`, {}, {
        withCredentials: true
      });
      await fetchRuns();
    } catch (error) {
      console.error("Failed to trigger workflow:", error);
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!n8nJson) return;
    
    const blob = new Blob([JSON.stringify(n8nJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-workflow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (!n8nJson) return;
    
    navigator.clipboard.writeText(JSON.stringify(n8nJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="workflow-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-['IBM_Plex_Sans'] font-bold text-2xl text-white mb-1">Workflow Management</h1>
          <p className="text-[#A1A1AA] text-sm">Run workflows and export n8n configuration</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleTriggerWorkflow}
            disabled={triggerLoading}
            data-testid="run-workflow-btn"
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* n8n JSON Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-[#121212] border-[#27272A]">
            <CardHeader className="pb-4">
              <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-[#FF5E00]" />
                n8n Workflow JSON
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[#A1A1AA] text-sm">
                Download or copy the n8n workflow JSON to import into your n8n instance.
              </p>
              
              {/* Preview */}
              {n8nJson && (
                <div className="terminal-output max-h-48 overflow-y-auto text-xs">
                  <pre className="text-[#A1A1AA]">
                    {JSON.stringify(n8nJson, null, 2).slice(0, 1000)}...
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadJson}
                  disabled={!n8nJson}
                  data-testid="download-json-btn"
                  className="flex-1 bg-[#FF5E00] hover:bg-[#FF5E00]/90 text-white font-['IBM_Plex_Sans'] font-semibold uppercase tracking-wider"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleCopyJson}
                  disabled={!n8nJson}
                  variant="outline"
                  data-testid="copy-json-btn"
                  className="bg-transparent border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] text-white"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-[#0A0A0A] border border-[#27272A] rounded-md">
                <p className="text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B] mb-2">
                  Setup Instructions
                </p>
                <ol className="text-xs text-[#A1A1AA] space-y-1 list-decimal list-inside">
                  <li>Download the JSON file</li>
                  <li>Open your n8n instance</li>
                  <li>Go to Workflows → Import from File</li>
                  <li>Configure your Google credentials in n8n</li>
                  <li>Update the Google Sheet URL in the workflow</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Workflow Runs History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-[#121212] border-[#27272A]">
            <CardHeader className="pb-4">
              <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FF5E00]" />
                Run History
                <span className="text-sm font-normal text-[#52525B] ml-2">
                  ({runs.length} runs)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {runs.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {runs.map((run, index) => (
                    <motion.div
                      key={run.run_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="p-4 bg-[#0A0A0A] border border-[#27272A] rounded-md hover:border-[#FF5E00]/30 transition-colors"
                      data-testid={`workflow-run-${index}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {run.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-[#00FF94]" />
                          ) : run.status === 'running' ? (
                            <div className="w-4 h-4 border-2 border-[#FFD600] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#FF2A2A]" />
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            run.status === 'completed' ? 'badge-success' : 
                            run.status === 'running' ? 'badge-pending' : 'badge-error'
                          }`}>
                            {run.status}
                          </span>
                        </div>
                        <span className="font-['JetBrains_Mono'] text-xs text-[#52525B]">
                          {run.run_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="font-['JetBrains_Mono'] text-lg text-white">{run.invoices_processed}</p>
                          <p className="text-xs text-[#52525B]">Invoices</p>
                        </div>
                        <div>
                          <p className="font-['JetBrains_Mono'] text-lg text-white">{run.emails_scanned}</p>
                          <p className="text-xs text-[#52525B]">Emails</p>
                        </div>
                        <div>
                          <p className="font-['JetBrains_Mono'] text-lg text-[#00FF94]">{run.attachments_downloaded}</p>
                          <p className="text-xs text-[#52525B]">Downloaded</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#27272A] flex items-center justify-between text-xs text-[#52525B]">
                        <span>Started: {new Date(run.started_at).toLocaleString()}</span>
                        {run.completed_at && (
                          <span>Completed: {new Date(run.completed_at).toLocaleString()}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
                  <p className="text-[#52525B] text-sm">No workflow runs yet</p>
                  <p className="text-[#27272A] text-xs mt-1">Click "Run Workflow" to start</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkflowPage;
