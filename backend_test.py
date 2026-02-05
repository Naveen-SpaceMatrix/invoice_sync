import requests
import sys
from datetime import datetime
import json

class InvoiceAPITester:
    def __init__(self, base_url="https://email-invoice-sync.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        print(f"🔧 Testing API at: {self.base_url}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            
            print(f"   Status: {response.status_code} (expected {expected_status})")
            
            if response.text:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED")
            else:
                print(f"❌ FAILED")

            return success, response.json() if response.text and response.headers.get('content-type', '').startswith('application/json') else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Connection Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test health and root endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("Root Health Check", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_auth_endpoints_unauthenticated(self):
        """Test auth endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS (Unauthenticated)")
        print("="*50)
        
        # These should fail with 401 without proper session
        self.run_test("Get Current User (No Auth)", "GET", "auth/me", 401)

    def test_protected_endpoints_unauthenticated(self):
        """Test protected endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING PROTECTED ENDPOINTS (Unauthenticated)")
        print("="*50)
        
        # All these should return 401 without auth
        endpoints = [
            ("invoices", "GET"),
            ("settings", "GET"),
            ("workflow/n8n-json", "GET"),
            ("dashboard/stats", "GET"),
            ("invoices/stats", "GET"),
            ("workflow/runs", "GET"),
            ("email-scans", "GET"),
            ("attachments", "GET")
        ]
        
        for endpoint, method in endpoints:
            self.run_test(f"{endpoint.title()} (No Auth)", method, endpoint, 401)

    def create_test_user_and_session(self):
        """Create test user and session in MongoDB for authenticated testing"""
        import subprocess
        
        print("\n" + "="*50)
        print("CREATING TEST USER AND SESSION")
        print("="*50)
        
        # Generate unique identifiers
        timestamp = int(datetime.now().timestamp())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        mongo_script = f"""
        use('test_database');
        db.users.insertOne({{
            user_id: '{self.user_id}',
            email: 'test.user.{timestamp}@example.com',
            name: 'Test User {timestamp}',
            picture: 'https://via.placeholder.com/150',
            created_at: new Date()
        }});
        db.user_sessions.insertOne({{
            user_id: '{self.user_id}',
            session_token: '{self.session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        print('Created test user: {self.user_id}');
        print('Session token: {self.session_token}');
        """
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print(f"✅ Created test user: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ Failed to create test user: {result.stderr}")
                return False
        
        except Exception as e:
            print(f"❌ Error creating test user: {str(e)}")
            return False

    def test_auth_endpoints_authenticated(self):
        """Test auth endpoints with authentication"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS (Authenticated)")
        print("="*50)
        
        success, response = self.run_test("Get Current User (Authenticated)", "GET", "auth/me", 200)
        
        if success and response:
            print(f"   User ID: {response.get('user_id')}")
            print(f"   Email: {response.get('email')}")
            print(f"   Name: {response.get('name')}")

    def test_protected_endpoints_authenticated(self):
        """Test protected endpoints with authentication"""
        print("\n" + "="*50)
        print("TESTING PROTECTED ENDPOINTS (Authenticated)")
        print("="*50)
        
        # Test GET endpoints
        endpoints = [
            ("settings", "GET"),
            ("invoices", "GET"),
            ("invoices/stats", "GET"),
            ("dashboard/stats", "GET"),
            ("workflow/runs", "GET"),
            ("workflow/n8n-json", "GET"),
            ("email-scans", "GET"),
            ("attachments", "GET")
        ]
        
        for endpoint, method in endpoints:
            self.run_test(f"{endpoint.title()}", method, endpoint, 200)
        
        # Test workflow trigger (POST)
        self.run_test("Trigger Workflow", "POST", "workflow/trigger", 200)
        
        # Test settings update (PUT)
        settings_data = {
            "google_sheet_url": "https://docs.google.com/spreadsheets/d/test123/edit",
            "google_drive_folder_id": "test-folder-123"
        }
        self.run_test("Update Settings", "PUT", "settings", 200, data=settings_data)

    def cleanup_test_data(self):
        """Clean up test user and session data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        if not self.user_id:
            print("No test user to clean up")
            return
        
        import subprocess
        
        mongo_script = f"""
        use('test_database');
        db.users.deleteMany({{user_id: '{self.user_id}'}});
        db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
        db.user_settings.deleteMany({{user_id: '{self.user_id}'}});
        db.invoices.deleteMany({{user_id: '{self.user_id}'}});
        db.email_scans.deleteMany({{user_id: '{self.user_id}'}});
        db.attachments.deleteMany({{user_id: '{self.user_id}'}});
        db.workflow_runs.deleteMany({{user_id: '{self.user_id}'}});
        print('Cleaned up test data for user: {self.user_id}');
        """
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print(f"✅ Cleaned up test data for user: {self.user_id}")
            else:
                print(f"⚠️  Failed to clean up test data: {result.stderr}")
        
        except Exception as e:
            print(f"⚠️  Error cleaning up test data: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed")
            return 1

def main():
    tester = InvoiceAPITester()
    
    try:
        # Test public endpoints
        tester.test_health_endpoints()
        
        # Test endpoints without authentication (should fail)
        tester.test_auth_endpoints_unauthenticated()
        tester.test_protected_endpoints_unauthenticated()
        
        # Create test user and session for authenticated tests
        if tester.create_test_user_and_session():
            # Test with authentication
            tester.test_auth_endpoints_authenticated()
            tester.test_protected_endpoints_authenticated()
        else:
            print("❌ Could not create test user, skipping authenticated tests")
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
    finally:
        # Always try to clean up
        tester.cleanup_test_data()
        return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())