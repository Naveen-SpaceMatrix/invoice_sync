from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
import re
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# MODELS
# =============================================================================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    user_id: str
    invoice_number: str
    status: str = "not_updated"  # not_updated, matched, not_matched, downloaded
    email_subject: Optional[str] = None
    email_from: Optional[str] = None
    email_date: Optional[str] = None
    attachment_name: Optional[str] = None
    drive_link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailScanResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scan_id: str = Field(default_factory=lambda: f"scan_{uuid.uuid4().hex[:12]}")
    user_id: str
    email_id: str
    subject: str
    sender: str
    date: str
    has_attachment: bool
    extracted_invoice_numbers: List[str]
    matched_invoice: Optional[str] = None
    status: str = "scanned"  # scanned, matched, downloaded, error
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Attachment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    attachment_id: str = Field(default_factory=lambda: f"att_{uuid.uuid4().hex[:12]}")
    user_id: str
    invoice_number: str
    filename: str
    drive_file_id: Optional[str] = None
    drive_link: Optional[str] = None
    email_subject: str
    downloaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkflowRun(BaseModel):
    model_config = ConfigDict(extra="ignore")
    run_id: str = Field(default_factory=lambda: f"run_{uuid.uuid4().hex[:12]}")
    user_id: str
    status: str = "pending"  # pending, running, completed, failed
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    invoices_processed: int = 0
    emails_scanned: int = 0
    attachments_downloaded: int = 0
    errors: List[str] = []

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    google_sheet_url: Optional[str] = None
    google_drive_folder_id: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Request/Response Models
class SessionRequest(BaseModel):
    session_id: str

class SettingsUpdate(BaseModel):
    google_sheet_url: Optional[str] = None
    google_drive_folder_id: Optional[str] = None

# =============================================================================
# AUTH HELPERS
# =============================================================================

async def get_current_user(request: Request) -> User:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

@api_router.post("/auth/session")
async def create_session(request: SessionRequest, response: Response):
    """Exchange session_id for session_token"""
    try:
        async with httpx.AsyncClient() as client_http:
            resp = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            data = resp.json()
    except httpx.RequestError as e:
        logger.error(f"Auth request failed: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    
    email = data.get("email")
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        
        # Create default settings
        await db.user_settings.insert_one({
            "user_id": user_id,
            "google_sheet_url": None,
            "google_drive_folder_id": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture
    }

@api_router.post("/auth/logout")
async def logout(response: Response, user: User = Depends(get_current_user)):
    """Logout user"""
    await db.user_sessions.delete_many({"user_id": user.user_id})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# =============================================================================
# SETTINGS ENDPOINTS
# =============================================================================

@api_router.get("/settings")
async def get_settings(user: User = Depends(get_current_user)):
    """Get user settings"""
    settings = await db.user_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    if not settings:
        settings = {
            "user_id": user.user_id,
            "google_sheet_url": None,
            "google_drive_folder_id": None
        }
        await db.user_settings.insert_one(settings.copy())
    return settings

@api_router.put("/settings")
async def update_settings(
    settings_update: SettingsUpdate,
    user: User = Depends(get_current_user)
):
    """Update user settings"""
    update_data = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.user_settings.update_one(
        {"user_id": user.user_id},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.user_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    return settings

# =============================================================================
# INVOICE ENDPOINTS
# =============================================================================

@api_router.get("/invoices")
async def get_invoices(user: User = Depends(get_current_user)):
    """Get all invoices for user"""
    invoices = await db.invoices.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return invoices

@api_router.get("/invoices/stats")
async def get_invoice_stats(user: User = Depends(get_current_user)):
    """Get invoice statistics"""
    total = await db.invoices.count_documents({"user_id": user.user_id})
    not_updated = await db.invoices.count_documents({"user_id": user.user_id, "status": "not_updated"})
    matched = await db.invoices.count_documents({"user_id": user.user_id, "status": "matched"})
    downloaded = await db.invoices.count_documents({"user_id": user.user_id, "status": "downloaded"})
    not_matched = await db.invoices.count_documents({"user_id": user.user_id, "status": "not_matched"})
    
    return {
        "total": total,
        "not_updated": not_updated,
        "matched": matched,
        "downloaded": downloaded,
        "not_matched": not_matched
    }

# =============================================================================
# EMAIL SCAN ENDPOINTS
# =============================================================================

@api_router.get("/email-scans")
async def get_email_scans(user: User = Depends(get_current_user)):
    """Get all email scan results"""
    scans = await db.email_scans.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return scans

# =============================================================================
# ATTACHMENT ENDPOINTS
# =============================================================================

@api_router.get("/attachments")
async def get_attachments(user: User = Depends(get_current_user)):
    """Get all downloaded attachments"""
    attachments = await db.attachments.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("downloaded_at", -1).to_list(1000)
    return attachments

# =============================================================================
# WORKFLOW ENDPOINTS
# =============================================================================

@api_router.get("/workflow/runs")
async def get_workflow_runs(user: User = Depends(get_current_user)):
    """Get workflow run history"""
    runs = await db.workflow_runs.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("started_at", -1).to_list(100)
    return runs

@api_router.post("/workflow/trigger")
async def trigger_workflow(user: User = Depends(get_current_user)):
    """Trigger the invoice matching workflow"""
    # Check if user has settings configured
    settings = await db.user_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not settings or not settings.get("google_sheet_url"):
        raise HTTPException(
            status_code=400,
            detail="Please configure Google Sheet URL in settings first"
        )
    
    # Create workflow run
    run = WorkflowRun(user_id=user.user_id, status="running")
    run_doc = run.model_dump()
    run_doc["started_at"] = run_doc["started_at"].isoformat()
    await db.workflow_runs.insert_one(run_doc)
    
    # Simulate workflow execution (in real implementation, this would be async)
    # For demo purposes, we'll create sample data
    
    # Sample invoices from "Google Sheet"
    sample_invoices = [
        {"invoice_number": "INV-2024-001", "status": "not_updated"},
        {"invoice_number": "INV-2024-002", "status": "not_updated"},
        {"invoice_number": "INV-2024-003", "status": "not_updated"},
        {"invoice_number": "TAX-2024-001", "status": "not_updated"},
        {"invoice_number": "TAX-2024-002", "status": "not_updated"},
    ]
    
    # Sample email scan results
    sample_emails = [
        {
            "email_id": f"email_{uuid.uuid4().hex[:8]}",
            "subject": "Tax Invoice INV-2024-001 attached",
            "sender": "vendor@example.com",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "has_attachment": True,
            "extracted_invoice_numbers": ["INV-2024-001"],
            "matched_invoice": "INV-2024-001",
            "status": "matched"
        },
        {
            "email_id": f"email_{uuid.uuid4().hex[:8]}",
            "subject": "Invoice TAX-2024-001 for your records",
            "sender": "billing@supplier.com",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "has_attachment": True,
            "extracted_invoice_numbers": ["TAX-2024-001"],
            "matched_invoice": "TAX-2024-001",
            "status": "matched"
        },
        {
            "email_id": f"email_{uuid.uuid4().hex[:8]}",
            "subject": "Monthly statement",
            "sender": "accounts@company.com",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            "has_attachment": False,
            "extracted_invoice_numbers": [],
            "matched_invoice": None,
            "status": "scanned"
        },
    ]
    
    invoices_processed = 0
    emails_scanned = len(sample_emails)
    attachments_downloaded = 0
    
    # Store invoices
    for inv in sample_invoices:
        existing = await db.invoices.find_one({
            "user_id": user.user_id,
            "invoice_number": inv["invoice_number"]
        })
        if not existing:
            invoice = Invoice(
                user_id=user.user_id,
                invoice_number=inv["invoice_number"],
                status=inv["status"]
            )
            inv_doc = invoice.model_dump()
            inv_doc["created_at"] = inv_doc["created_at"].isoformat()
            inv_doc["updated_at"] = inv_doc["updated_at"].isoformat()
            await db.invoices.insert_one(inv_doc)
            invoices_processed += 1
    
    # Store email scans and process matches
    for email in sample_emails:
        scan = EmailScanResult(
            user_id=user.user_id,
            email_id=email["email_id"],
            subject=email["subject"],
            sender=email["sender"],
            date=email["date"],
            has_attachment=email["has_attachment"],
            extracted_invoice_numbers=email["extracted_invoice_numbers"],
            matched_invoice=email["matched_invoice"],
            status=email["status"]
        )
        scan_doc = scan.model_dump()
        scan_doc["created_at"] = scan_doc["created_at"].isoformat()
        await db.email_scans.insert_one(scan_doc)
        
        # Update matched invoice status and create attachment
        if email["matched_invoice"] and email["has_attachment"]:
            await db.invoices.update_one(
                {"user_id": user.user_id, "invoice_number": email["matched_invoice"]},
                {
                    "$set": {
                        "status": "downloaded",
                        "email_subject": email["subject"],
                        "email_from": email["sender"],
                        "email_date": email["date"],
                        "attachment_name": f"{email['matched_invoice']}.pdf",
                        "drive_link": f"https://drive.google.com/file/d/sample_{email['matched_invoice']}/view",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Create attachment record
            attachment = Attachment(
                user_id=user.user_id,
                invoice_number=email["matched_invoice"],
                filename=f"{email['matched_invoice']}.pdf",
                drive_file_id=f"sample_{email['matched_invoice']}",
                drive_link=f"https://drive.google.com/file/d/sample_{email['matched_invoice']}/view",
                email_subject=email["subject"]
            )
            att_doc = attachment.model_dump()
            att_doc["downloaded_at"] = att_doc["downloaded_at"].isoformat()
            await db.attachments.insert_one(att_doc)
            attachments_downloaded += 1
    
    # Update workflow run status
    await db.workflow_runs.update_one(
        {"run_id": run.run_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "invoices_processed": invoices_processed,
                "emails_scanned": emails_scanned,
                "attachments_downloaded": attachments_downloaded
            }
        }
    )
    
    return {
        "run_id": run.run_id,
        "status": "completed",
        "invoices_processed": invoices_processed,
        "emails_scanned": emails_scanned,
        "attachments_downloaded": attachments_downloaded
    }

@api_router.get("/workflow/n8n-json")
async def get_n8n_workflow_json(user: User = Depends(get_current_user)):
    """Generate n8n workflow JSON for export"""
    settings = await db.user_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    sheet_url = settings.get("google_sheet_url", "YOUR_GOOGLE_SHEET_URL") if settings else "YOUR_GOOGLE_SHEET_URL"
    folder_id = settings.get("google_drive_folder_id", "YOUR_DRIVE_FOLDER_ID") if settings else "YOUR_DRIVE_FOLDER_ID"
    
    # Extract sheet ID from URL if full URL provided
    sheet_id = sheet_url
    if "spreadsheets/d/" in sheet_url:
        sheet_id = sheet_url.split("spreadsheets/d/")[1].split("/")[0]
    
    n8n_workflow = {
        "name": "Invoice Email Matching Workflow",
        "nodes": [
            {
                "parameters": {},
                "id": "trigger-1",
                "name": "Manual Trigger",
                "type": "n8n-nodes-base.manualTrigger",
                "typeVersion": 1,
                "position": [250, 300]
            },
            {
                "parameters": {
                    "operation": "read",
                    "documentId": {
                        "__rl": True,
                        "value": sheet_id,
                        "mode": "id"
                    },
                    "sheetName": {
                        "__rl": True,
                        "value": "gid=1919138850",
                        "mode": "id"
                    },
                    "options": {
                        "range": "A:D"
                    }
                },
                "id": "sheets-1",
                "name": "Read Google Sheet",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 4.5,
                "position": [450, 300],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": "YOUR_CREDENTIAL_ID",
                        "name": "Google Sheets OAuth2"
                    }
                },
                "notes": "Sheet columns: A=S.No, B=Invoice No, C=Organization, D=status"
            },
            {
                "parameters": {
                    "conditions": {
                        "options": {
                            "caseSensitive": False,
                            "leftValue": "",
                            "typeValidation": "loose"
                        },
                        "conditions": [
                            {
                                "id": "condition-1",
                                "leftValue": "={{ $json.status }}",
                                "rightValue": "not updated",
                                "operator": {
                                    "type": "string",
                                    "operation": "equals"
                                }
                            }
                        ],
                        "combinator": "and"
                    },
                    "options": {}
                },
                "id": "filter-1",
                "name": "Filter Not Updated",
                "type": "n8n-nodes-base.filter",
                "typeVersion": 2,
                "position": [650, 300],
                "notes": "Filter rows where status column (D) = 'not updated'"
            },
            {
                "parameters": {
                    "resource": "message",
                    "operation": "getAll",
                    "returnAll": False,
                    "limit": 100,
                    "filters": {
                        "q": "subject:(tax invoice OR invoice) has:attachment"
                    },
                    "options": {}
                },
                "id": "gmail-1",
                "name": "Get Gmail Messages",
                "type": "n8n-nodes-base.gmail",
                "typeVersion": 2.1,
                "position": [850, 300],
                "credentials": {
                    "gmailOAuth2": {
                        "id": "YOUR_GMAIL_CREDENTIAL_ID",
                        "name": "Gmail OAuth2"
                    }
                }
            },
            {
                "parameters": {
                    "jsCode": `// Extract invoice numbers from email subject and body
// Sheet columns: A=S.No, B=Invoice No, C=Organization, D=status

const invoicePatterns = [
  /[A-Z]{2,4}[-/]?\\d{2,4}[-/]?\\d{2,6}/gi,  // Matches: INV-2024-001, TAX/2024/123, etc.
  /INVOICE\\s*#?\\s*[A-Z0-9-]+/gi,
  /TAX\\s*INVOICE\\s*#?\\s*[A-Z0-9-]+/gi
];

const emails = $input.all();
const invoices = $('Filter Not Updated').all();

const results = [];

for (const email of emails) {
  const subject = email.json.subject || '';
  const snippet = email.json.snippet || '';
  const body = email.json.body || '';
  const text = (subject + ' ' + snippet + ' ' + body).toUpperCase();
  
  let extractedNumbers = [];
  for (const pattern of invoicePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      extractedNumbers = extractedNumbers.concat(matches.map(m => m.trim()));
    }
  }
  
  // Find matching invoice from sheet (Column B = "Invoice No")
  for (const inv of invoices) {
    const invNumber = (inv.json['Invoice No'] || inv.json.invoice_number || inv.json.invoiceNumber || '').toString().toUpperCase();
    
    if (!invNumber) continue;
    
    const matched = extractedNumbers.some(extracted => {
      const cleanExtracted = extracted.replace(/[-\\s/]/g, '');
      const cleanInv = invNumber.replace(/[-\\s/]/g, '');
      return cleanExtracted.includes(cleanInv) || cleanInv.includes(cleanExtracted) || extracted.includes(invNumber);
    });
    
    if (matched) {
      results.push({
        emailId: email.json.id,
        invoiceNumber: inv.json['Invoice No'] || invNumber,
        rowNumber: inv.json['S.No'],
        organization: inv.json['Organization'],
        subject: subject,
        hasMatch: true
      });
    }
  }
}

return results.map(r => ({json: r}));`
                },
                "id": "code-1",
                "name": "Match Invoices",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [1050, 300],
                "notes": "Matches invoice numbers from emails with Column B (Invoice No) from sheet"
            },
            {
                "parameters": {
                    "resource": "message",
                    "operation": "get",
                    "messageId": "={{ $json.emailId }}",
                    "options": {
                        "attachmentPrefix": "attachment_"
                    }
                },
                "id": "gmail-2",
                "name": "Get Email Attachments",
                "type": "n8n-nodes-base.gmail",
                "typeVersion": 2.1,
                "position": [1250, 300],
                "credentials": {
                    "gmailOAuth2": {
                        "id": "YOUR_GMAIL_CREDENTIAL_ID",
                        "name": "Gmail OAuth2"
                    }
                }
            },
            {
                "parameters": {
                    "operation": "upload",
                    "folderId": folder_id,
                    "name": "={{ $json.invoiceNumber }}_{{ $now.format('yyyy-MM-dd') }}.pdf",
                    "options": {}
                },
                "id": "drive-1",
                "name": "Upload to Google Drive",
                "type": "n8n-nodes-base.googleDrive",
                "typeVersion": 3,
                "position": [1450, 300],
                "credentials": {
                    "googleDriveOAuth2Api": {
                        "id": "YOUR_DRIVE_CREDENTIAL_ID",
                        "name": "Google Drive OAuth2"
                    }
                }
            },
            {
                "parameters": {
                    "operation": "update",
                    "documentId": {
                        "__rl": True,
                        "value": sheet_url,
                        "mode": "url"
                    },
                    "sheetName": {
                        "__rl": True,
                        "value": "Sheet1",
                        "mode": "list"
                    },
                    "columns": {
                        "mappingMode": "defineBelow",
                        "value": {
                            "status": "downloaded",
                            "drive_link": "={{ $json.webViewLink }}"
                        }
                    },
                    "options": {
                        "cellFormat": "USER_ENTERED"
                    }
                },
                "id": "sheets-2",
                "name": "Update Sheet Status",
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 4.5,
                "position": [1650, 300],
                "credentials": {
                    "googleSheetsOAuth2Api": {
                        "id": "YOUR_CREDENTIAL_ID",
                        "name": "Google Sheets OAuth2"
                    }
                }
            }
        ],
        "connections": {
            "Manual Trigger": {
                "main": [[{"node": "Read Google Sheet", "type": "main", "index": 0}]]
            },
            "Read Google Sheet": {
                "main": [[{"node": "Filter Not Updated", "type": "main", "index": 0}]]
            },
            "Filter Not Updated": {
                "main": [[{"node": "Get Gmail Messages", "type": "main", "index": 0}]]
            },
            "Get Gmail Messages": {
                "main": [[{"node": "Match Invoices", "type": "main", "index": 0}]]
            },
            "Match Invoices": {
                "main": [[{"node": "Get Email Attachments", "type": "main", "index": 0}]]
            },
            "Get Email Attachments": {
                "main": [[{"node": "Upload to Google Drive", "type": "main", "index": 0}]]
            },
            "Upload to Google Drive": {
                "main": [[{"node": "Update Sheet Status", "type": "main", "index": 0}]]
            }
        },
        "settings": {
            "executionOrder": "v1"
        },
        "staticData": None,
        "meta": {
            "instanceId": "generated-workflow"
        },
        "tags": ["invoice", "automation", "email"]
    }
    
    return n8n_workflow

# =============================================================================
# DASHBOARD STATS
# =============================================================================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: User = Depends(get_current_user)):
    """Get dashboard overview statistics"""
    invoice_stats = await get_invoice_stats(user)
    
    recent_runs = await db.workflow_runs.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("started_at", -1).to_list(5)
    
    recent_attachments = await db.attachments.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("downloaded_at", -1).to_list(5)
    
    total_runs = await db.workflow_runs.count_documents({"user_id": user.user_id})
    total_attachments = await db.attachments.count_documents({"user_id": user.user_id})
    
    return {
        "invoice_stats": invoice_stats,
        "recent_runs": recent_runs,
        "recent_attachments": recent_attachments,
        "total_runs": total_runs,
        "total_attachments": total_attachments
    }

# =============================================================================
# HEALTH CHECK
# =============================================================================

@api_router.get("/")
async def root():
    return {"message": "Invoice Workflow API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and configure app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
