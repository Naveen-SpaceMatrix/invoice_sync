import { motion } from "framer-motion";
import { FileText, Mail, Cloud, Zap, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

const LandingPage = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Google Sheets Integration",
      description: "Automatically read invoice numbers from your spreadsheet"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Gmail Scanning",
      description: "Scan emails for tax invoices and extract attachments"
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Google Drive Storage",
      description: "Download and organize attachments in your Drive"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "n8n Workflow Export",
      description: "Export ready-to-use workflow for your n8n instance"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1759159347827-de3a54002de7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBnZW9tZXRyaWMlMjB0ZWNobm9sb2d5JTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzAyNjg3ODB8MA&ixlib=rb-4.1.0&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/70 to-[#0A0A0A]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5E00] rounded-md flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-['IBM_Plex_Sans'] font-bold text-xl tracking-tight text-white">
              InvoiceSync
            </span>
          </div>
          <Button 
            onClick={handleLogin}
            data-testid="header-login-btn"
            className="bg-[#FF5E00] hover:bg-[#FF5E00]/90 text-white font-['IBM_Plex_Sans'] font-semibold uppercase tracking-wider px-6 shadow-[0_0_15px_rgba(255,94,0,0.3)]"
          >
            Sign In
          </Button>
        </header>

        {/* Hero Section */}
        <main className="px-6 pt-20 pb-32 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-[#FF5E00]/10 border border-[#FF5E00]/20 rounded-full text-[#FF5E00] text-sm font-['IBM_Plex_Sans'] font-medium uppercase tracking-wider mb-8">
              Automation Workflow
            </span>
            
            <h1 className="font-['IBM_Plex_Sans'] font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
              Automate Invoice
              <span className="text-[#FF5E00]"> Email Matching</span>
              <br />with n8n Workflows
            </h1>
            
            <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-10 font-['Manrope']">
              Connect Google Sheets, Gmail, and Drive to automatically match invoices 
              with email attachments and organize them in your cloud storage.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                data-testid="hero-get-started-btn"
                className="bg-[#FF5E00] hover:bg-[#FF5E00]/90 text-white font-['IBM_Plex_Sans'] font-semibold uppercase tracking-wider px-8 py-6 text-base shadow-[0_0_20px_rgba(255,94,0,0.4)] animate-pulse-glow"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline"
                data-testid="hero-learn-more-btn"
                className="border-[#27272A] hover:border-[#FF5E00]/50 hover:text-[#FF5E00] bg-transparent text-white font-['IBM_Plex_Sans'] font-medium px-8 py-6 text-base transition-colors"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="group p-6 bg-[#121212] border border-[#27272A] rounded-md hover:border-[#FF5E00]/30 hover:bg-[#1E1E1E] transition-all duration-300 hover:-translate-y-1"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 bg-[#FF5E00]/10 border border-[#FF5E00]/20 rounded-md flex items-center justify-center text-[#FF5E00] mb-4 group-hover:bg-[#FF5E00]/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-['IBM_Plex_Sans'] font-semibold text-white text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#A1A1AA] text-sm font-['Manrope'] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Workflow Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-24"
          >
            <div className="text-center mb-12">
              <h2 className="font-['IBM_Plex_Sans'] font-bold text-2xl sm:text-3xl text-white mb-4">
                How It Works
              </h2>
              <p className="text-[#A1A1AA] max-w-xl mx-auto">
                Simple 4-step automation that saves hours of manual work
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
              {[
                { step: "01", title: "Read Sheet", desc: "Fetch invoices with 'not updated' status" },
                { step: "02", title: "Scan Emails", desc: "Search Gmail for invoice keywords" },
                { step: "03", title: "Match & Extract", desc: "Match numbers and get attachments" },
                { step: "04", title: "Store in Drive", desc: "Upload to Google Drive folder" }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div 
                    className="w-64 p-6 bg-[#121212] border border-[#27272A] rounded-md text-center"
                    data-testid={`workflow-step-${index}`}
                  >
                    <span className="font-['JetBrains_Mono'] text-[#FF5E00] text-sm">{item.step}</span>
                    <h4 className="font-['IBM_Plex_Sans'] font-semibold text-white mt-2 mb-1">{item.title}</h4>
                    <p className="text-[#52525B] text-sm">{item.desc}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden lg:block w-8 h-px bg-[#27272A] mx-0" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-[#27272A]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[#52525B] text-sm">
              Built for n8n automation workflows
            </span>
            <span className="text-[#52525B] text-sm font-['JetBrains_Mono']">
              v1.0.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
