import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, ExternalLink, FileSpreadsheet, FolderOpen } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Toaster, toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    google_sheet_url: "",
    google_drive_folder_id: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings`, {
          withCredentials: true
        });
        setSettings({
          google_sheet_url: response.data.google_sheet_url || "",
          google_drive_folder_id: response.data.google_drive_folder_id || ""
        });
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings, {
        withCredentials: true
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <div>
        <h1 className="font-['IBM_Plex_Sans'] font-bold text-2xl text-white mb-1">Settings</h1>
        <p className="text-[#A1A1AA] text-sm">Configure your Google integrations</p>
      </div>

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-[#121212] border-[#27272A]">
          <CardHeader>
            <CardTitle className="font-['IBM_Plex_Sans'] text-lg text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#FF5E00]" />
              Integration Settings
            </CardTitle>
            <CardDescription className="text-[#52525B]">
              Configure the Google Sheet and Drive folder for the workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sheet URL */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#00FF94]" />
                Google Sheet URL
              </Label>
              <Input
                value={settings.google_sheet_url}
                onChange={(e) => setSettings({ ...settings, google_sheet_url: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                data-testid="sheet-url-input"
                className="bg-[#0A0A0A] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#FF5E00]"
              />
              <p className="text-xs text-[#52525B]">
                The spreadsheet containing invoice numbers with a "status" column
              </p>
            </div>

            {/* Google Drive Folder ID */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#FFD600]" />
                Google Drive Folder ID
              </Label>
              <Input
                value={settings.google_drive_folder_id}
                onChange={(e) => setSettings({ ...settings, google_drive_folder_id: e.target.value })}
                placeholder="1a2b3c4d5e6f7g8h9i0j..."
                data-testid="drive-folder-input"
                className="bg-[#0A0A0A] border-[#27272A] text-white placeholder:text-[#52525B] focus:border-[#FF5E00]"
              />
              <p className="text-xs text-[#52525B]">
                The Drive folder ID where attachments will be saved (find it in the folder URL)
              </p>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-[#0A0A0A] border border-[#27272A] rounded-md">
              <p className="text-xs font-['IBM_Plex_Sans'] uppercase tracking-wider text-[#52525B] mb-3">
                Setup Guide
              </p>
              <div className="space-y-4 text-sm text-[#A1A1AA]">
                <div>
                  <p className="font-medium text-white mb-1">Your Google Sheet Format</p>
                  <p className="text-xs">
                    Columns: <code className="font-['JetBrains_Mono'] text-[#FF5E00]">S.No</code> (A), <code className="font-['JetBrains_Mono'] text-[#FF5E00]">Invoice No</code> (B), <code className="font-['JetBrains_Mono'] text-[#FF5E00]">Organization</code> (C), <code className="font-['JetBrains_Mono'] text-[#FF5E00]">status</code> (D)
                  </p>
                  <p className="text-xs mt-1">
                    Status: <code className="font-['JetBrains_Mono'] text-[#FFD600]">not updated</code> → processed → <code className="font-['JetBrains_Mono'] text-[#00FF94]">downloaded</code>
                  </p>
                </div>
                <div>
                  <p className="font-medium text-white mb-1">How to Use</p>
                  <ol className="text-xs space-y-1 list-decimal list-inside">
                    <li>Save these settings</li>
                    <li>Go to <span className="text-[#FF5E00]">Workflow</span> → Download n8n JSON</li>
                    <li>Import into your n8n instance</li>
                    <li>Configure Google OAuth in n8n</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              data-testid="save-settings-btn"
              className="w-full bg-[#FF5E00] hover:bg-[#FF5E00]/90 text-white font-['IBM_Plex_Sans'] font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(255,94,0,0.3)]"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <a
          href="https://docs.google.com/spreadsheets"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-[#121212] border border-[#27272A] rounded-md hover:border-[#FF5E00]/30 transition-colors flex items-center gap-3"
        >
          <FileSpreadsheet className="w-6 h-6 text-[#00FF94]" />
          <div>
            <p className="text-white text-sm font-medium">Google Sheets</p>
            <p className="text-[#52525B] text-xs">Create or open your invoice sheet</p>
          </div>
          <ExternalLink className="w-4 h-4 text-[#52525B] ml-auto" />
        </a>
        <a
          href="https://drive.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-[#121212] border border-[#27272A] rounded-md hover:border-[#FF5E00]/30 transition-colors flex items-center gap-3"
        >
          <FolderOpen className="w-6 h-6 text-[#FFD600]" />
          <div>
            <p className="text-white text-sm font-medium">Google Drive</p>
            <p className="text-[#52525B] text-xs">Access your attachment folder</p>
          </div>
          <ExternalLink className="w-4 h-4 text-[#52525B] ml-auto" />
        </a>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
