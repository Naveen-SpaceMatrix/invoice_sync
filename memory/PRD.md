# InvoiceSync - n8n Invoice Email Matching Workflow Dashboard

## Original Problem Statement
Build a n8n workflow to take invoice numbers whose status column has the value "not updated", then go to email check for emails containing "tax invoice" or "invoice" keywords, extract invoice numbers from body/subject, match with the spreadsheet, download attachments and store in Google Drive.

## User Choices
- **n8n Workflow JSON**: Exportable workflow file for n8n instances
- **Email Provider**: Gmail
- **Spreadsheet Source**: Google Sheets
- **Authentication**: Emergent Google Auth for Drive integration
- **UI Dashboard**: Invoice status view, workflow triggers, attachment history

## Architecture
```
├── Frontend (React + Tailwind)
│   ├── Landing Page with Google OAuth
│   ├── Dashboard - stats overview
│   ├── Invoices - list with status filtering
│   ├── Email Scans - terminal-style log view
│   ├── Attachments - downloaded files grid
│   ├── Workflow - n8n JSON export + run history
│   └── Settings - Google Sheet/Drive configuration
│
├── Backend (FastAPI + MongoDB)
│   ├── Auth - Emergent Google OAuth
│   ├── Invoices CRUD
│   ├── Email scan results
│   ├── Attachments tracking
│   ├── Workflow execution (simulated)
│   └── n8n JSON generation
│
└── n8n Workflow JSON
    ├── Manual Trigger
    ├── Read Google Sheet
    ├── Filter Not Updated
    ├── Get Gmail Messages
    ├── Match Invoices (Code node)
    ├── Get Email Attachments
    ├── Upload to Google Drive
    └── Update Sheet Status
```

## What's Been Implemented (2026-02-05)
- [x] Landing page with Google OAuth integration
- [x] Dashboard with invoice stats, quick actions, recent runs
- [x] Invoice list with search and status filtering
- [x] Email scan results page (terminal-style)
- [x] Attachments page with Drive links
- [x] Workflow management with n8n JSON export
- [x] Settings page for Google Sheet/Drive config
- [x] Complete n8n workflow JSON generation
- [x] Workflow trigger simulation
- [x] User authentication with Emergent Auth

## MOCKED APIs
- **Google Gmail API**: Workflow simulates email scanning with sample data
- **Google Sheets API**: Uses sample invoice data
- **Google Drive API**: Generates sample Drive links

## Remaining Backlog
### P0 (Critical)
- None - MVP complete

### P1 (High Priority)
- Real Google API integration (requires OAuth credentials)
- Webhook trigger for n8n workflow
- Email parsing improvements

### P2 (Nice to Have)
- Batch processing for large sheets
- Email scheduling
- Attachment preview
- Export reports

## User Personas
1. **Business Owner**: Wants automated invoice-email matching
2. **n8n User**: Needs exportable workflow for their instance
3. **Accountant**: Tracks invoice status and downloads

## Next Tasks
1. Configure real Google API credentials for Gmail/Sheets/Drive
2. Implement actual email scanning with Gmail API
3. Add real Google Sheets integration
4. Enable real Drive uploads
