from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel
import httpx
import os
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from starlette.config import Config

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware

from typing import List, Dict
from fastapi import Body, HTTPException

# Load environment variables
config = Config(".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development only)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.add_middleware(SessionMiddleware, secret_key=config("SECRET_KEY"), session_cookie="session_id")

# Serve the frontend files
#app.mount("/", StaticFiles(directory=".", html=True), name="static")
app.mount("/static", StaticFiles(directory="."), name="static")
# Root endpoint to serve the frontend
@app.get("/")
async def read_index():
    with open("index.html", "r") as f:
        return HTMLResponse(content=f.read())

# OAuth Setup
oauth = OAuth(config)
oauth.register(
    "slack",
    client_id=config("SLACK_CLIENT_ID"),
    client_secret=config("SLACK_CLIENT_SECRET"),
    authorize_url="https://slack.com/oauth/v2/authorize",
    access_token_url="https://slack.com/api/oauth.v2.access",
    client_kwargs={"scope": "channels:history chat:write users:read"},
)

oauth.register(
    "google",
    client_id=config("GOOGLE_CLIENT_ID"),
    client_secret=config("GOOGLE_CLIENT_SECRET"),
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    access_token_url="https://oauth2.googleapis.com/token",
    client_kwargs={
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",  # Request offline access
        "prompt": "consent",       # Force the consent screen to appear
    },
)

# Pydantic Models
class SlackAuthResponse(BaseModel):
    access_token: str
    scope: str

class GoogleAuthResponse(BaseModel):
    access_token: str
    refresh_token: str

class Event(BaseModel):
    summary: str
    start_time: str  # Format: 'YYYY-MM-DDTHH:MM:SSZ'
    end_time: str


#Google Token Refresh
async def refresh_google_token(refresh_token: str):
    credentials = Credentials(
        token=None,  # No initial token
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=config("GOOGLE_CLIENT_ID"),
        client_secret=config("GOOGLE_CLIENT_SECRET"),
    )
    
    # Refresh the token
    credentials.refresh(GoogleRequest())
    
    # Return the new access token
    return credentials.token

# Add this before your root endpoint
@app.get("/styles.css")
async def get_css():
    with open("styles.css", "r") as f:
        return Response(content=f.read(), media_type="text/css")

@app.get("/script.js")
async def get_js():
    with open("script.js", "r") as f:
        return Response(content=f.read(), media_type="text/javascript")
	    
# Slack Authentication Endpoint
@app.get("/api/slack/login")  # Note the /api prefix
async def slack_login(request: Request):
    redirect_uri = "https://ai-powered-slack-assistant.vercel.app/api/slack/callback"
    return await oauth.slack.authorize_redirect(request, redirect_uri)
	
@app.get("/api/slack/callback")
async def slack_callback(request: Request):
    token = await oauth.slack.authorize_access_token(request)
    if not token:
        raise HTTPException(status_code=400, detail="Slack authentication failed")
    
    # Store Slack token in session
    request.session["slack_token"] = token["access_token"]
    return SlackAuthResponse(access_token=token["access_token"], scope=token["scope"])

# Google Authentication Endpoint
@app.get("/api/google/login")
async def google_login(request: Request):
    return await oauth.google.authorize_redirect(request, "https://ai-powered-slack-assistant.vercel.app/api/google/callback")

@app.get("/api/google/callback")
async def google_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    if not token:
        raise HTTPException(status_code=400, detail="Google authentication failed")
    
    # Store Google token in session
    request.session["google_token"] = token["access_token"]
    
    # Check if refresh token is present
    refresh_token = token.get("refresh_token")
    if refresh_token:
        request.session["google_refresh_token"] = refresh_token
    
    return {"message": "Google authentication successful", "token": token["access_token"]}

# Slack Message Fetching Endpoint
@app.get("/api/slack/messages")
async def fetch_slack_messages(request: Request, channel_id: str):
    # Retrieve Slack token from session
    token = request.session.get("slack_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with Slack")
    
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://slack.com/api/conversations.history?channel={channel_id}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        if response.status_code != 200 or not response.json().get("ok"):
            raise HTTPException(status_code=400, detail="Error fetching Slack messages")
        return response.json()

# Google Calendar Event Creation
@app.post("/api/calendar/event")
async def create_calendar_event(request: Request, event: Event = Depends):
    # Retrieve Google token from session
    token = request.session.get("google_token")
    refresh_token = request.session.get("google_refresh_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with Google")

    # Refresh token if necessary
    if refresh_token:
        try:
            new_token = await refresh_google_token(refresh_token)
            request.session["google_token"] = new_token  # Update token in session
            token = new_token  # Use the new token
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Failed to refresh token: {str(e)}")

    # Create event using Google Calendar API
    url = "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    event_data = {
    "summary": event.summary,
    "start": {
        "dateTime": event.start_time,  # Must be in ISO 8601 format
        "timeZone": "UTC"
    },
    "end": {
        "dateTime": event.end_time,
        "timeZone": "UTC"
    }
	}
    async with httpx.AsyncClient() as client:
    	response = await client.post(url, json=event_data, headers=headers)
    
    	print("Google API Response Code:", response.status_code)  # Debugging
    	print("Google API Response:", response.text)  # Logs full error message

    	if response.status_code != 200:
        	raise HTTPException(status_code=400, detail=f"Google API Error: {response.text}")
    
    	return response.json()
    
    
# AI-Powered Message Summarization
# Update the summarization endpoint
@app.post("/api/ai/summarize")
async def summarize_messages(request: Request):
    try:
        # Get and parse the request body
        body = await request.json()
        
        # Validate request format
        if not isinstance(body, dict) or "messages" not in body:
            raise HTTPException(
                status_code=400,
                detail="Invalid request format. Expected {'messages': [...]}"
            )

        # Extract message texts
        message_list = [
            msg.get("text", "").strip()
            for msg in body["messages"]
            if isinstance(msg, dict) and msg.get("text")
        ]

        if not message_list:
            raise HTTPException(
                status_code=400,
                detail="No valid messages with text content found"
            )

        # Debugging logs
        print(f"Received {len(message_list)} messages for summarization")
        if message_list:
            print("First message preview:", message_list[0][:50] + "...")

        # OpenAI API call
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {config('OPENAI_API_KEY')}"},
                json={
                    "model": "gpt-4",
                    "messages": [{
                        "role": "user",
                        "content": f"Summarize these chat messages concisely. Focus on key points and action items:\n\n{'\n'.join(message_list)}"
                    }],
                    "temperature": 0.7
                },
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            return {"summary": result["choices"][0]["message"]["content"]}
            
    except httpx.HTTPStatusError as e:
        error_detail = e.response.json().get("error", {}).get("message", "Unknown error")
        print(f"OpenAI API Error: {error_detail}")
        raise HTTPException(status_code=500, detail=f"OpenAI API Error: {error_detail}")
        
    except Exception as e:
        print(f"Summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))        
# Root Endpoint
@app.get("/api")
def root():
    return {"message": "AI-Powered Slack Assistant is running with OAuth!"}
# Add CORSMiddleware



