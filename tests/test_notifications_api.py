import requests
import sys

def test_api():
    # Login to get token (using test user from previous contexts if possible, or just assuming dev mode might allow loose auth? No, need token)
    # Actually, let's just inspect the DB directly again, or try to hit the endpoint if I can get a token.
    # Simpler: The backend unit/integration tests would cover this.
    # But I can use the python script to hit localhost:8000
    
    # 1. Login
    login_data = {
        "username": "test@gmail.com", # Default test user often used
        "password": "password"
    }
    
    try:
        # Note: Adjust endpoint if it's /auth/token or /token. 
        # Looking at auth router (not shown but usually /auth/token)
        # I'll try /auth/token
        base_url = "http://127.0.0.1:8000"
        
        # Checking auth router path
        # Assuming standard OAuth2 form or JSON
        response = requests.post(f"{base_url}/auth/token", data=login_data)
        
        if response.status_code != 200:
            # Try JSON
            response = requests.post(f"{base_url}/auth/login", json={"email": "test@gmail.com", "password": "password"})
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # 2. Get Notifications
            resp = requests.get(f"{base_url}/notifications/", headers=headers)
            print(f"Notifications Status: {resp.status_code}")
            print(f"Notifications: {resp.json()}")
        else:
            print("Login failed, skipping API verification")
            print(response.text)

    except Exception as e:
        print(f"API Test Failed (might be offline): {e}")

if __name__ == "__main__":
    test_api()
