Oura API Documentation (2.0)
Download OpenAPI specification:Download

Terms of Service
Overview
The Oura API allows Oura users and partner applications to improve their user experience with Oura data. This document describes the Oura API Version 2 (V2), which is the only available integration point for Oura data. The previous V1 API has been sunset.

Getting Started
What is an API?
An API (Application Programming Interface) allows different software applications to communicate with each other. The Oura API enables you to access your Oura Ring data programmatically.

Quick Start Guide
Register an API Application and implement OAuth2
Make Your First API Call:
curl -X GET https://api.ouraring.com/v2/usercollection/personal_info \
-H "Authorization: Bearer YOUR_TOKEN_HERE"
Explore Data Types:
Browse the available endpoints in this documentation to discover what data you can access
Each endpoint includes example requests and responses
Set Up Webhooks (Strongly Recommended):
Webhooks are the preferred way to consume Oura data
We have not had customers hit rate limits with webhooks properly implemented
Make a single request for historical data when a user first connects, then use webhooks for ongoing updates
Webhook notifications come approximately 30 seconds after data syncs from the mobile app
Set up webhooks to receive notifications when data changes
Common Questions
Rate Limits: The API is limited to 5000 requests per 5-minute period. You will almost certainly not have rate limit issues if webhooks are properly integrated into your system.
Data Delay: Different data types sync at different times - sleep data requires users to open the Oura app, while daily activity and stress may sync in the background
Data Access
In order to access data, a registered API Application is required. API Applications are limited to 10 users before requiring approval from Oura. There is no limit once an application is approved. Additionally, Oura users must provide consent to share each data type an API Application has access to. All data access requests through the Oura API require Authentication. Additionally, we recommend that Oura users keep their mobile app updated to support API access for the latest data types.

Authentication
The Oura Cloud API supports authentication through the industry-standard OAuth2 protocol. For more information, see our Authentication instructions. Access tokens must be included in the request header as follows:

GET /v2/usercollection/personal_info HTTP/1.1
Host: api.ouraring.com
Authorization: Bearer <token>
Please note that personal access tokens were deprecated in December 2025 and are no longer available for use.

BearerAuth
Security Scheme Type HTTP
HTTP Authorization Scheme bearer
OAuth2
Security Scheme Type OAuth2
authorizationCode OAuth Flow
Authorization URL: https://cloud.ouraring.com/oauth/authorize
Token URL: https://api.ouraring.com/oauth/token
Scopes:
email - Email address of the user
personal - Personal information (gender, age, height, weight)
daily - Daily summaries of sleep, activity and readiness
heartrate - Time series heart rate for Gen 3 users
workout - Summaries for auto-detected and user entered workouts
tag User - entered tags
session - Guided and unguided sessions in the Oura app
spo2Daily - SpO2 Average recorded during sleep
ClientIdAuth
Client ID for webhook subscription endpoints. Must be used together with x-client-secret header.

Security Scheme Type API Key
Header parameter name: x-client-id
ClientSecretAuth
Client Secret for webhook subscription endpoints. Must be used together with x-client-id header.

Security Scheme Type API Key
Header parameter name: x-client-secret
Oura HTTP Response Codes
Response Code Description
200 OK Successful Response
400 Query Parameter Validation Error The request contains query parameters that are invalid or incorrectly formatted.
401 Unauthorized Invalid or expired authentication token.
403 Forbidden The requested resource requires additional permissions or the user's Oura subscription has expired.
429 Request Rate Limit Exceeded The API is rate limited to 5000 requests in a 5 minute period. You will receive a 429 error code if you exceed this limit. Contact us if you expect your usage to exceed this limit.
Data Model & Concepts
Core Concepts
The Oura API provides access to various types of health data collected by the Oura Ring. Understanding how this data is organized is essential for effective API usage.

Data Types Overview
Daily Summaries: Aggregated metrics for each day (sleep score, readiness score, activity score)
Time Series Data: Detailed measurements taken throughout the day (heart rate, HRV, temperature)
Events: Discrete occurrences such as workouts, tags, and sessions
Data Processing Timeline
Data Collection: The Oura Ring continuously collects biometric data
Syncing: Data transfers to the Oura cloud when users sync their ring via the mobile app
Processing: Algorithms analyze raw data to generate insights and scores
API Availability: Processed data becomes available through API endpoints
Data Syncing Behavior
Different data types follow different syncing patterns:
User-Initiated Sync Data:
Sleep Data: Only syncs when the user opens the Oura app and actively syncs their ring
Sleep Time Recommendations: Updated after sleep data syncs
Readiness: Calculated after sleep data is processed
Background Sync Data:
Daily Activity: Updates periodically in the background
Daily Stress: Updates periodically in the background
Heart Rate: Updates periodically in the background This difference in syncing behavior affects when data becomes available through the API. For the most reliable access to all data types, we strongly recommend implementing webhooks to receive notifications when new data is available.
Common Data Structures
Timestamps: All time-based data uses ISO 8601 format
Scores: Range from 0-100, with higher values indicating better performance
Durations: Provided in seconds unless otherwise specified
IDs: Unique identifiers for specific data objects follow a consistent format
Data Freshness
The Oura API provides the most recently synced data, which depends on when users last synced their ring. For real-time updates, consider using webhooks to receive notifications when new data becomes available.
Best Practices for Data Access
Initial Load: When a user first connects to your application, make a single request for historical data
Ongoing Updates: Use webhooks for all subsequent data updates
Webhook Integration: This approach minimizes API calls and ensures you always have the latest data
Error Handling: Be prepared for occasional gaps in data if users don't regularly sync their rings
API Version Information
The current Oura API (V2) is the only available integration point. The previous V1 API has been sunset and is no longer available.
Code Examples
Below are end-to-end examples showing how to use the Oura API in different programming languages:

OAuth2 Authentication Flow
Python
import requests
import json
from urllib.parse import urlencode
import webbrowser

# Your OAuth2 application credentials

CLIENT_ID = "YOUR_CLIENT_ID"
CLIENT_SECRET = "YOUR_CLIENT_SECRET"
REDIRECT_URI = "YOUR_REDIRECT_URI"

# Step 1: Direct user to authorization page

auth_params = {
"client_id": CLIENT_ID,
"redirect_uri": REDIRECT_URI,
"response_type": "code",
"scope": "daily heartrate personal"
}
auth_url = f"https://cloud.ouraring.com/oauth/authorize?{urlencode(auth_params)}"
print(f"Please visit this URL to authorize: {auth_url}")
webbrowser.open(auth_url)

# Step 2: Exchange authorization code for access token

# After user authorizes, they'll be redirected to your redirect URI with a code parameter

auth_code = input("Enter the authorization code from the redirect URL: ")

token_url = "https://api.ouraring.com/oauth/token"
token_data = {
"grant_type": "authorization_code",
"code": auth_code,
"client_id": CLIENT_ID,
"client_secret": CLIENT_SECRET,
"redirect_uri": REDIRECT_URI
}
response = requests.post(token_url, data=token_data)
tokens = response.json()
access_token = tokens["access_token"]
refresh_token = tokens["refresh_token"]

# Step 3: Use the access token to make API calls

headers = {"Authorization": f"Bearer {access_token}"}
sleep_data = requests.get(
"https://api.ouraring.com/v2/usercollection/sleep",
headers=headers,
params={"start_date": "2023-01-01", "end_date": "2023-01-07"}
)
print(json.dumps(sleep_data.json(), indent=2))

# Step 4: Refresh the token when it expires

def refresh_access_token(refresh_token):
token_data = {
"grant_type": "refresh_token",
"refresh_token": refresh_token,
"client_id": CLIENT_ID,
"client_secret": CLIENT_SECRET
}
response = requests.post(token_url, data=token_data)
new_tokens = response.json()
return new_tokens["access_token"], new_tokens["refresh_token"]
JavaScript
// Step 1: Redirect to authorization page
const authorizeUser = () => {
const CLIENT_ID = "YOUR_CLIENT_ID";
const REDIRECT_URI = "YOUR_REDIRECT_URI";
const scopes = ["daily", "heartrate", "personal"];

const authUrl = `https://cloud.ouraring.com/oauth/authorize?` +
`client_id=${CLIENT_ID}&` +
`redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
`response_type=code&` +
`scope=${scopes.join(" ")}`;

// Redirect user to authorization page
window.location.href = authUrl;
};

// Step 2: Exchange authorization code for access token
// This should be implemented on your server to protect your client secret
async function getAccessToken(code) {
const response = await fetch("https://api.ouraring.com/oauth/token", {
method: "POST",
headers: {
"Content-Type": "application/x-www-form-urlencoded",
},
body: new URLSearchParams({
grant_type: "authorization_code",
code: code,
client_id: "YOUR_CLIENT_ID",
client_secret: "YOUR_CLIENT_SECRET",
redirect_uri: "YOUR_REDIRECT_URI"
})
});

const tokens = await response.json();
return tokens;
}

// Step 3: Make API calls
async function fetchSleepData(accessToken) {
const startDate = "2023-01-01";
const endDate = "2023-01-07";

const response = await fetch(
`https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
{
headers: {
Authorization: `Bearer ${accessToken}`
}
}
);

return await response.json();
}
Working with Webhooks
NodeJS Express Server Example
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const CLIENT_SECRET = "YOUR_CLIENT_SECRET";

// Verification endpoint for webhook setup
app.get('/oura-webhook', (req, res) => {
const { verification_token, challenge } = req.query;

// Verify the token matches what you expect
if (verification_token === "YOUR_VERIFICATION_TOKEN") {
res.json({ challenge });
} else {
res.status(401).send('Invalid verification token');
}
});

// Webhook handler for incoming data
app.post('/oura-webhook', (req, res) => {
const signature = req.headers['x-oura-signature'];
const timestamp = req.headers['x-oura-timestamp'];

// Verify HMAC signature for security
const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
hmac.update(timestamp + JSON.stringify(req.body));
const calculatedSignature = hmac.digest('hex').toUpperCase();

if (calculatedSignature !== signature) {
return res.status(401).send('Invalid signature');
}

// Process the webhook data
const { event_type, data_type, object_id, user_id } = req.body;

console.log(`Received ${event_type} event for ${data_type}`);

// Fetch the updated data using the object_id
// This should be done asynchronously to respond quickly
fetchDataAsync(data_type, object_id, user_id);

// Respond quickly to acknowledge receipt
res.status(200).send('OK');
});

app.listen(3000, () => {
console.log('Webhook server listening on port 3000');
});

// Asynchronous function to fetch the updated data
async function fetchDataAsync(dataType, objectId, userId) {
// Implementation depends on your data storage and processing needs
// This would typically fetch the new data from the Oura API
// and update your database or application state
}
Frequently Asked Questions
General Questions
What is the Oura API used for?
The Oura API allows developers to access Oura Ring data programmatically. This enables building applications, conducting research, or personal projects that use sleep, activity, readiness, and other health metrics collected by the Oura Ring.

How do I get started with the Oura API?
Register an OAuth application
Read the documentation and explore the available endpoints
Make your first API call using the examples provided
What data types are available in the API?
The Oura API provides access to various data types including:
Sleep metrics and stages
Activity and movement data
Readiness scores and contributors
Heart rate and HRV measurements
Workout information
Tags and sessions
And more specialized metrics like SpO2, body temperature, and stress levels
Is the Oura API free to use?
Yes, the Oura API is free to use for both personal and commercial applications. However, API applications accessing more than 10 users require approval from Oura.
Technical Questions
What's the recommended way to consume Oura data?
Webhooks are the preferred way to consume Oura data. We recommend:

Make a single request for historical data when a user first connects to your application
Set up webhook subscriptions for all data types you need
Use webhook notifications to get updates as new data becomes available This approach is efficient and we have not had customers hit rate limits with webhooks properly implemented.
How do I handle rate limits?
The Oura API is limited to 5000 requests per 5-minute period. To avoid hitting rate limits:
Use webhooks instead of polling (strongly recommended - we have not seen any customers hit rate limits with webhooks properly implemented)
Cache responses when appropriate
Batch requests for multiple days of data rather than individual day requests
Implement exponential backoff when you receive a 429 response
Why am I not seeing today's data?
Oura Ring data availability depends on the data type:
Sleep, Readiness, and Sleep Time data: Only available after the user opens the Oura app and syncs their ring
Daily Activity, Daily Stress, and Heart Rate: May update periodically in the background For the most reliable access to all data types, implement webhooks to receive notifications when new data is available (approximately 30 seconds after the data syncs from the mobile app).
How do I handle timezone differences?
All timestamps in the Oura API use ISO 8601 format with timezone information. When querying data with date parameters, the dates are interpreted in the user's local timezone. Make sure to account for this when processing data across different timezones.
What API version should I use?
The current Oura API (V2) is the only available integration point. The previous V1 API has been sunset and is no longer available.
How do webhooks work with the Oura API?
Webhooks allow you to receive near real-time notifications when new data is available, rather than constantly polling the API. You'll need to:
Set up an endpoint on your server to receive webhook events
Create webhook subscriptions for each data type and event type you're interested in
Verify your endpoint when creating subscriptions
Process webhook events as they arrive
Fetch the full data using the provided IDs Webhook notifications arrive approximately 30 seconds after data syncs from the mobile app.
Troubleshooting
I'm getting 401 Unauthorized errors
This typically means your access token is invalid or expired. Check that:

You're including the token correctly in the Authorization header
The token hasn't expired (they typically last 30 days)
The user hasn't revoked access
For OAuth2 applications, try refreshing the token
I'm getting 403 Forbidden errors
This usually means the user's Oura subscription has expired or they haven't granted permission for the specific data type you're requesting.
Why am I not receiving webhook events?
Ensure that:
Your webhook endpoint is publicly accessible
The endpoint responds to the verification challenge correctly
Your endpoint responds within 10 seconds with a 2xx or 3xx status code
You've subscribed to the correct data types and event types
The user has synced their ring recently to generate new data
How can I validate that a webhook is legitimate?
Always verify the HMAC signature included in the x-oura-signature header using your client secret as shown in the webhook code examples.
Best Practices
What's the best approach for accessing historical data?
We recommend:

When a user first connects to your application, make a single request for historical data
For ongoing updates, use webhooks instead of repeated API calls
Store the historical data in your own database for easy access
Only fetch new or updated data based on webhook notifications This approach minimizes API calls and ensures your application always has the latest data without hitting rate limits.
How should I handle missing data?
Some users may have gaps in their data if they didn't wear their ring or haven't synced it recently. Your application should:
Check for null values in responses
Have fallback logic for missing data points
Consider displaying gaps in visualizations rather than connecting across missing data
Use webhooks to ensure you're promptly notified when new data becomes available
What's the best way to get historical data?
To efficiently retrieve a large amount of historical data:
Use date range queries with reasonable time spans (e.g., 1-3 months at a time)
Implement pagination using the next_token parameter for large result sets
Consider running historical data collection as a background job
Store the data in your own database to avoid repeated API calls
How can I ensure user privacy?
Only request access to the data types your application needs
Store tokens securely and never expose them in client-side code
Implement proper security measures for storing health data
Be transparent with users about how their data will be used
Allow users to disconnect your application and delete their data
Authentication Troubleshooting
Common Authentication Issues
"401 Unauthorized" Error
This is the most common authentication error and typically means there's an issue with your token. Here are the most frequent causes and solutions:

1. Invalid Token Format
   Problem: The token you're using isn't formatted correctly in the request. Solution: Ensure you're including "Bearer" before your token:

Authorization: Bearer your-token-here
Example Correct Implementation:

// JavaScript example
fetch('https://api.ouraring.com/v2/usercollection/personal_info', {
headers: {
'Authorization': 'Bearer ' + accessToken // Note the space after "Bearer"
}
}) 2. Expired Token
Problem: OAuth2 access tokens expire after a period (typically 24 hours for Oura). Solution: Use your refresh token to get a new access token:

POST https://api.ouraring.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=YOUR_REFRESH_TOKEN&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
Handling Token Expiration:

// JavaScript example of handling expired tokens
async function callApi(endpoint, accessToken, refreshToken) {
try {
const response = await fetch(`https://api.ouraring.com/v2/${endpoint}`, {
headers: {
'Authorization': `Bearer ${accessToken}`
}
});

    if (response.status === 401) {
      // Token expired, try to refresh
      const newTokens = await refreshAccessToken(refreshToken);

      // Retry the request with the new token
      return fetch(`https://api.ouraring.com/v2/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${newTokens.access_token}`
        }
      });
    }

    return response;

} catch (error) {
console.error('API call failed:', error);
throw error;
}
}

async function refreshAccessToken(refreshToken) {
const response = await fetch('https://api.ouraring.com/oauth/token', {
method: 'POST',
headers: {
'Content-Type': 'application/x-www-form-urlencoded'
},
body: new URLSearchParams({
'grant_type': 'refresh_token',
'refresh_token': refreshToken,
'client_id': YOUR_CLIENT_ID,
'client_secret': YOUR_CLIENT_SECRET
})
});

return response.json();
} 3. Revoked Access
Problem: The user has revoked access to your application.

Solution: The user needs to re-authorize your application. Direct them to the authorization URL:

https://cloud.ouraring.com/oauth/authorize?
client_id=YOUR_CLIENT_ID&
redirect_uri=YOUR_REDIRECT_URI&
response_type=code&
scope=daily heartrate personal
"403 Forbidden" Error
This error means your authentication is valid, but you don't have permission to access the requested resource.

1. Missing Scope Permission
   Problem: Your OAuth application doesn't have the necessary scope for the endpoint. Solution: Request the needed scopes during authorization:

https://cloud.ouraring.com/oauth/authorize?
client_id=YOUR_CLIENT_ID&
redirect_uri=YOUR_REDIRECT_URI&
response_type=code&
scope=daily heartrate personal workout session
Available Scopes:

daily: Daily summaries (sleep, activity, readiness)
heartrate: Heart rate data
personal: Personal information (age, gender, etc.)
workout: Workout data
session: Session data
tag: Tag data 2. Expired Oura Membership
Problem*: The user's Oura membership has expired.
Solution*: The user needs to renew their Oura membership to restore API access.
OAuth2 Flow Debugging
Authorization Code Flow Issues
Problem*: Not receiving an authorization code after user consent.
Solutions*:
Verify your redirect URI exactly matches what's registered in your application
Check for errors in the redirect (look for error and error_description query parameters)
Ensure the user is completing the consent process
Example Debugging:

// Parse the URL after redirect
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

if (error) {
console.error(`Authorization failed: ${error} - ${errorDescription}`);
} else {
const code = urlParams.get('code');
if (code) {
// Proceed with token exchange
} else {
console.error('No authorization code received in the redirect');
}
}
Token Exchange Issues
Problem: Error when exchanging authorization code for tokens. Common Errors and Solutions:

invalid_grant: The authorization code is expired (valid for only 10 minutes) or already used
invalid_client: Client ID or secret is incorrect
invalid_redirect_uri: Redirect URI doesn't match the one used during authorization
Testing Token Exchange\*:

# Using curl to debug token exchange

curl -X POST https://api.ouraring.com/oauth/token -d "grant_type=authorization_code" -d "code=YOUR_AUTH_CODE" -d "client_id=YOUR_CLIENT_ID" -d "client_secret=YOUR_CLIENT_SECRET" -d "redirect_uri=YOUR_REDIRECT_URI"
Authentication Best Practices
Security Recommendations
Never store access tokens in client-side code or expose them in URLs
Use HTTPS for all communication with the Oura API
Store refresh tokens securely (e.g., in an encrypted database)
Implement token rotation to regularly refresh access tokens
Validate tokens before using them if they've been stored for a while
Token Management
Create a token service in your backend to handle token operations:
Storing tokens securely
Refreshing expired tokens
Associating tokens with user accounts
Handle token revocation gracefully:
Detect when a token has been revoked
Clear local token storage
Prompt the user to re-authorize when needed
Implement proper error handling:
Distinguish between different types of auth errors
Provide clear messages to users
Log authentication issues for debugging
Daily Activity Routes
The Daily Activity scope includes daily activity summary values and detailed activity levels. Activity levels are expressed in metabolic equivalent of task minutes (MET mins). Oura tracks activity based on the movement.

Multiple Daily Activity Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_activity

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_activity?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Activity Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_activity/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_activity/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"class_5_min": "string",
"score": 0,
"active_calories": 0,
"average_met_minutes": 0,
"contributors": {
"meet_daily_targets": 0,
"move_every_hour": 0,
"recovery_time": 0,
"stay_active": 0,
"training_frequency": 0,
"training_volume": 0
},
"equivalent_walking_distance": 0,
"high_activity_met_minutes": 0,
"high_activity_time": 0,
"inactivity_alerts": 0,
"low_activity_met_minutes": 0,
"low_activity_time": 0,
"medium_activity_met_minutes": 0,
"medium_activity_time": 0,
"met": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"meters_to_target": 0,
"non_wear_time": 0,
"resting_time": 0,
"sedentary_met_minutes": 0,
"sedentary_time": 0,
"steps": 0,
"target_calories": 0,
"target_meters": 0,
"total_calories": 0,
"day": "2019-08-24",
"timestamp": "string"
}
Daily Cardiovascular Age Routes
Cardiovascular Age is an estimate of the health of your cardiovascular system in relation to your actual age. See more details here.

Multiple Daily Cardiovascular Age Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_cardiovascular_age

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_cardiovascular_age?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Cardiovascular Age Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_cardiovascular_age/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_cardiovascular_age/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"day": "2019-08-24",
"vascular_age": 0
}
Daily Readiness Routes
Readiness tells how ready you are for the day.

Multiple Daily Readiness Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_readiness

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Readiness Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_readiness/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_readiness/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"contributors": {
"activity_balance": 0,
"body_temperature": 0,
"hrv_balance": 0,
"previous_day_activity": 0,
"previous_night": 0,
"recovery_index": 0,
"resting_heart_rate": 0,
"sleep_balance": 0
},
"day": "2019-08-24",
"score": 0,
"temperature_deviation": 0,
"temperature_trend_deviation": 0,
"timestamp": "string"
}
Daily Resilience Routes
Resilience is an estimate of your ability to withstand physiological stress and recover from it over time.

Learn more about Resilience
Multiple Daily Resilience Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_resilience

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_resilience?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Resilience Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_resilience/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_resilience/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"contributors": {
"sleep_recovery": 0,
"daytime_recovery": 0,
"stress": 0
},
"level": "limited"
}
Daily Sleep Routes
Sleep period is a nearly continuous, longish period of time spent lying down in bed.

Multiple Daily Sleep Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_sleep

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Sleep Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_sleep/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_sleep/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"contributors": {
"deep_sleep": 0,
"efficiency": 0,
"latency": 0,
"rem_sleep": 0,
"restfulness": 0,
"timing": 0,
"total_sleep": 0
},
"day": "2019-08-24",
"score": 0,
"timestamp": "string"
}
Daily Spo2 Routes
The Daily SpO2 (blood oxygenation) routes include daily SpO2 average. Data will only be available for users with a Gen 3 Oura Ring

Blood Oxygen Sensing (SpO2) on Oura
Multiple Daily Spo2 Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_spo2

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_spo2?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Spo2 Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_spo2/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_spo2/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"spo2_percentage": {
"average": 0
},
"breathing_disturbance_index": 0
}
Daily Stress Routes
The daily stress route includes a summary of the number of minutes the user spends in high stress and high recovery each day. This is a great way to see how your stress and recovery are trending over time. Stress and recovery are mutally exclusive. E.g. one can only be stressed or recovered at any given moement - and cannot be stressed and recovered at the same time.

Learn more about daytime stress
Multiple Daily Stress Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_stress

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_stress?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Daily Stress Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/daily_stress/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/daily_stress/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"stress_high": 0,
"recovery_high": 0,
"day_summary": "restored"
}
Enhanced Tag Routes
The Enhanced Tags data scope includes tags that Oura users enter within the Oura mobile app. Enhanced Tags can be added for any lifestyle choice, habit, mood change, or environmental factor an Oura user wants to monitor the effects of. Enhanced Tags also contain context on a tag's start and end time, whether a tag repeats daily, and comments.

Learn more about how Oura users add Enhanced Tags

More information about Enhanced Tags
Multiple Enhanced Tag Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/enhanced_tag

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/enhanced_tag?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Enhanced Tag Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/enhanced_tag/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/enhanced_tag/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"tag_type_code": "string",
"start_time": "string",
"end_time": "string",
"start_day": "2019-08-24",
"end_day": "2019-08-24",
"comment": "string",
"custom_name": "string"
}
Heart Rate Routes
The Heart Rate data scope includes time-series heart rate data throughout the day and night. Heart rate is provided at 5-minute increments. For heart rate data recorded from a Session, see Sessions endpoint.

How accurate is the heart rate data generated by the Oura Ring?
Multiple Heart Rate Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_datetime
string or null (Start Datetime)
end_datetime
string or null (End Datetime)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/heartrate

Request samples
cURLPythonJavaScriptJava

Copy

# The '+' symbol in the timezone must be escaped to `%2B` if included.

curl --location --request GET 'https://api.ouraring.com/v2/usercollection/heartrate?start_datetime=2021-11-01T00:00:00-08:00&end_datetime=2021-12-01T00:00:00-08:00' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Personal Info Routes
The Personal Info scope includes personal information (e.g. age, email, weight, and height) about the user. You can access the id on the personal_info route with any access token (no scopes are required).

Single Personal Info Document
Authorizations:
BearerAuthOAuth2
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
429 Request Rate Limit Exceeded.

get
/v2/usercollection/personal_info

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/personal_info' \
--header 'Authorization: Bearer <token>'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"age": 0,
"weight": 0,
"height": 0,
"biological_sex": "string",
"email": "string"
}
Rest Mode Period Routes
The Rest Mode scope includes information about rest mode periods. This includes the start, end time and detaials of the rest mode period.

Multiple Rest Mode Period Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/rest_mode_period

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/rest_mode_period?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Rest Mode Period Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/rest_mode_period/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/rest_mode_period/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"end_day": "2019-08-24",
"end_time": "string",
"episodes": [
{}
],
"start_day": "2019-08-24",
"start_time": "string"
}
Ring Configuration Routes
The Ring Configuration scope includes information about the user's ring(s). This includes the model, size, color, etc.

Multiple Ring Configuration Documents
Authorizations:
BearerAuthOAuth2
query Parameters
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/ring_configuration

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/ring_configuration' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Ring Configuration Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/ring_configuration/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/ring_configuration/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"color": "brushed_silver",
"design": "balance",
"firmware_version": "string",
"hardware_type": "gen1",
"set_up_at": "string",
"size": 0
}
Session Routes
The Sessions data scope provides information on how users engage with guided and unguided sessions in the Oura app, including the user's biometric trends during the sessions.

Learn about the available session types within the Explore Tab
Multiple Session Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/session

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/session?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Session Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/session/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/session/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"start_datetime": "string",
"end_datetime": "string",
"type": "breathing",
"heart_rate": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"heart_rate_variability": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"mood": "bad",
"motion_count": {
"interval": 0,
"items": [],
"timestamp": "string"
}
}
Sleep Routes
Returns Oura Sleep data for the specified Oura user within a given timeframe. A user can have multiple sleep periods per day.

Multiple Sleep Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/sleep

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/sleep?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Sleep Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/sleep/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/sleep/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"average_breath": 0,
"average_heart_rate": 0,
"average_hrv": 0,
"awake_time": 0,
"bedtime_end": "string",
"bedtime_start": "string",
"day": "2019-08-24",
"deep_sleep_duration": 0,
"efficiency": 0,
"heart_rate": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"hrv": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"latency": 0,
"light_sleep_duration": 0,
"low_battery_alert": true,
"lowest_heart_rate": 0,
"movement_30_sec": "string",
"period": 0,
"readiness": {
"contributors": {},
"score": 0,
"temperature_deviation": 0,
"temperature_trend_deviation": 0
},
"readiness_score_delta": 0,
"rem_sleep_duration": 0,
"restless_periods": 0,
"sleep_phase_5_min": "string",
"sleep_score_delta": 0,
"sleep_algorithm_version": "v1",
"sleep_analysis_reason": "foreground_sleep_analysis",
"time_in_bed": 0,
"total_sleep_duration": 0,
"type": "deleted"
}
Sleep Time Routes
Recommendations for the optimal bedtime window that is calculated based on sleep data.

Multiple Sleep Time Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/sleep_time

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/sleep_time?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Sleep Time Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/sleep_time/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/sleep_time/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"optimal_bedtime": {
"day_tz": 0,
"end_offset": 0,
"start_offset": 0
},
"recommendation": "improve_efficiency",
"status": "not_enough_nights"
}
Tag Routes
Note: Tag is deprecated. We recommend transitioning to Enhanced Tag.

The Tags data scope includes tags that Oura users enter within the Oura mobile app. Tags are a growing list of activities, environment factors, symptoms, emotions, and other aspects that provide broader context into what's happening with users beyond the objective data generated by the Oura Ring.

More information on tag translations

Multiple Tag Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/tag

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/tag?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Tag Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/tag/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/tag/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"text": "string",
"timestamp": "string",
"tags": [
"string"
]
}
VO2 Max Routes
VO2 Max is a measure of the maximum volume of oxygen that an individual can use during intense exercise. See more details here.

Multiple Vo2 Max Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/vO2_max

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/vO2_max?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Vo2 Max Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/vO2_max/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/vO2_max/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"timestamp": "string",
"vo2_max": 0
}
Workout Routes
The Workout data scope includes information about user workouts. This is a diverse, growing list of workouts that help inform how the user is training and exercising.

Multiple Workout Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/workout

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/workout?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Single Workout Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/usercollection/workout/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/usercollection/workout/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"activity": "string",
"calories": 0,
"day": "string",
"distance": 0,
"end_datetime": "string",
"intensity": "easy",
"label": "string",
"source": "manual",
"start_datetime": "string"
}
Sandbox Routes
Fake user data that you can access without an Oura account. There is a corresponding sandbox endpoint to each available data type. This is useful for testing and development purposes. The data is not real and should not be used for any production purposes. The data is generated by Oura and is not based on any real user data. The data is not updated in real-time and is not guaranteed to be accurate. The rate limit for the sandbox endpoints is shared with your rate limit on other data endpoints.

Sandbox - Multiple Tag Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/tag

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/tag?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Enhanced Tag Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/enhanced_tag

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/enhanced_tag?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Workout Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/workout

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/workout?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Session Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/session

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/session?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Activity Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_activity

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_activity?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Sleep Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_sleep

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_sleep?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Spo2 Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_spo2

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_spo2?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Readiness Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_readiness

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_readiness?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Sleep Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/sleep

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/sleep?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Sleep Time Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/sleep_time

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/sleep_time?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Rest Mode Period Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/rest_mode_period

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/rest_mode_period?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Ring Configuration Documents
Authorizations:
BearerAuthOAuth2
query Parameters
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/ring_configuration

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/ring_configuration' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Stress Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_stress

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_stress?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Resilience Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_resilience

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_resilience?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Daily Cardiovascular Age Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_cardiovascular_age

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_cardiovascular_age?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Multiple Vo2 Max Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_date
string or string or null (Start Date)
end_date
string or string or null (End Date)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/vO2_max

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/vO2_max?start_date=2021-11-01&end_date=2021-12-01' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Sandbox - Single Tag Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/tag/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/tag/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"text": "string",
"timestamp": "string",
"tags": [
"string"
]
}
Sandbox - Single Enhanced Tag Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/enhanced_tag/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/enhanced_tag/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"tag_type_code": "string",
"start_time": "string",
"end_time": "string",
"start_day": "2019-08-24",
"end_day": "2019-08-24",
"comment": "string",
"custom_name": "string"
}
Sandbox - Single Workout Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/workout/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/workout/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"activity": "string",
"calories": 0,
"day": "string",
"distance": 0,
"end_datetime": "string",
"intensity": "easy",
"label": "string",
"source": "manual",
"start_datetime": "string"
}
Sandbox - Single Session Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/session/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/session/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"start_datetime": "string",
"end_datetime": "string",
"type": "breathing",
"heart_rate": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"heart_rate_variability": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"mood": "bad",
"motion_count": {
"interval": 0,
"items": [],
"timestamp": "string"
}
}
Sandbox - Single Daily Activity Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_activity/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_activity/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"class_5_min": "string",
"score": 0,
"active_calories": 0,
"average_met_minutes": 0,
"contributors": {
"meet_daily_targets": 0,
"move_every_hour": 0,
"recovery_time": 0,
"stay_active": 0,
"training_frequency": 0,
"training_volume": 0
},
"equivalent_walking_distance": 0,
"high_activity_met_minutes": 0,
"high_activity_time": 0,
"inactivity_alerts": 0,
"low_activity_met_minutes": 0,
"low_activity_time": 0,
"medium_activity_met_minutes": 0,
"medium_activity_time": 0,
"met": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"meters_to_target": 0,
"non_wear_time": 0,
"resting_time": 0,
"sedentary_met_minutes": 0,
"sedentary_time": 0,
"steps": 0,
"target_calories": 0,
"target_meters": 0,
"total_calories": 0,
"day": "2019-08-24",
"timestamp": "string"
}
Sandbox - Single Daily Sleep Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_sleep/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_sleep/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"contributors": {
"deep_sleep": 0,
"efficiency": 0,
"latency": 0,
"rem_sleep": 0,
"restfulness": 0,
"timing": 0,
"total_sleep": 0
},
"day": "2019-08-24",
"score": 0,
"timestamp": "string"
}
Sandbox - Single Daily Spo2 Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_spo2/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_spo2/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"spo2_percentage": {
"average": 0
},
"breathing_disturbance_index": 0
}
Sandbox - Single Daily Readiness Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_readiness/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_readiness/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"contributors": {
"activity_balance": 0,
"body_temperature": 0,
"hrv_balance": 0,
"previous_day_activity": 0,
"previous_night": 0,
"recovery_index": 0,
"resting_heart_rate": 0,
"sleep_balance": 0
},
"day": "2019-08-24",
"score": 0,
"temperature_deviation": 0,
"temperature_trend_deviation": 0,
"timestamp": "string"
}
Sandbox - Single Sleep Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/sleep/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/sleep/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"average_breath": 0,
"average_heart_rate": 0,
"average_hrv": 0,
"awake_time": 0,
"bedtime_end": "string",
"bedtime_start": "string",
"day": "2019-08-24",
"deep_sleep_duration": 0,
"efficiency": 0,
"heart_rate": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"hrv": {
"interval": 0,
"items": [],
"timestamp": "string"
},
"latency": 0,
"light_sleep_duration": 0,
"low_battery_alert": true,
"lowest_heart_rate": 0,
"movement_30_sec": "string",
"period": 0,
"readiness": {
"contributors": {},
"score": 0,
"temperature_deviation": 0,
"temperature_trend_deviation": 0
},
"readiness_score_delta": 0,
"rem_sleep_duration": 0,
"restless_periods": 0,
"sleep_phase_5_min": "string",
"sleep_score_delta": 0,
"sleep_algorithm_version": "v1",
"sleep_analysis_reason": "foreground_sleep_analysis",
"time_in_bed": 0,
"total_sleep_duration": 0,
"type": "deleted"
}
Sandbox - Single Sleep Time Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/sleep_time/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/sleep_time/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"optimal_bedtime": {
"day_tz": 0,
"end_offset": 0,
"start_offset": 0
},
"recommendation": "improve_efficiency",
"status": "not_enough_nights"
}
Sandbox - Single Rest Mode Period Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/rest_mode_period/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/rest_mode_period/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"end_day": "2019-08-24",
"end_time": "string",
"episodes": [
{}
],
"start_day": "2019-08-24",
"start_time": "string"
}
Sandbox - Single Ring Configuration Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/ring_configuration/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/ring_configuration/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"color": "brushed_silver",
"design": "balance",
"firmware_version": "string",
"hardware_type": "gen1",
"set_up_at": "string",
"size": 0
}
Sandbox - Single Daily Stress Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_stress/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_stress/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"stress_high": 0,
"recovery_high": 0,
"day_summary": "restored"
}
Sandbox - Single Daily Resilience Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_resilience/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_resilience/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"contributors": {
"sleep_recovery": 0,
"daytime_recovery": 0,
"stress": 0
},
"level": "limited"
}
Sandbox - Single Daily Cardiovascular Age Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/daily_cardiovascular_age/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/daily_cardiovascular_age/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"day": "2019-08-24",
"vascular_age": 0
}
Sandbox - Single Vo2 Max Document
Authorizations:
BearerAuthOAuth2
path Parameters
document_id
required
string (Document Id)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
404 Not Found
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/vO2_max/{document_id}

Request samples
cURLPythonJavaScriptJava

Copy
curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/vO2_max/2-5daccc095220cc5493a4e9c2b681ca941e' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"day": "2019-08-24",
"timestamp": "string",
"vo2_max": 0
}
Sandbox - Multiple Heartrate Documents
Authorizations:
BearerAuthOAuth2
query Parameters
start_datetime
string or null (Start Datetime)
end_datetime
string or null (End Datetime)
next_token
string or null (Next Token)
Responses
200 Successful Response
400 Client Exception
401 Unauthorized access exception. Usually means the access token is expired, malformed or revoked.
403 Access forbidden. Usually means the user's subscription to Oura has expired and their data is not available via the API.
422 Validation Error
429 Request Rate Limit Exceeded.

get
/v2/sandbox/usercollection/heartrate

Request samples
cURLPythonJavaScriptJava

Copy

# The '+' symbol in the timezone must be escaped to `%2B` if included.

curl --location --request GET 'https://api.ouraring.com/v2/sandbox/usercollection/heartrate?start_datetime=2021-11-01T00:00:00-08:00&end_datetime=2021-12-01T00:00:00-08:00' \
--header 'Authorization: Bearer <token>'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"data": [
{}
],
"next_token": "string"
}
Webhook Subscription Routes
Webhooks for Real-Time Data Updates
What are Webhooks?
Webhooks are a way for the Oura API to notify your application when new data is available, instead of requiring your application to constantly check for updates (polling). Think of webhooks as "reverse APIs" - instead of your application requesting data, Oura's servers send data to your application when something changes.

Why Use Webhooks (Important!)
RECOMMENDED APPROACH: Webhooks are the preferred way to consume Oura data
Avoid Rate Limits: We have not had customers hit rate limits with webhooks properly implemented
Near Real-Time Updates: Webhook notifications come approximately 30 seconds after data syncs from the mobile app
Efficient Resource Usage: Reduces unnecessary API calls and server load
Better User Experience: Your application stays updated without constant polling
How Webhooks Work with Oura
You set up an endpoint: Create a URL on your server that can receive POST requests
You subscribe to events: Tell Oura what data types and events you want to be notified about
Oura verifies your endpoint: A one-time check to ensure your endpoint is valid
Oura sends notifications: When data changes, Oura sends a POST request to your endpoint
You process the event: Your endpoint receives basic event details
You fetch complete data: Use the provided IDs to retrieve the full data via the API
Recommended Implementation Pattern
Initial Data Load: When a user first connects, make a single API request for historical data
Subscribe to Webhooks: Set up webhook subscriptions for all data types you need
Process Webhook Events: As users sync their rings, you'll receive notifications about new data
Fetch Updated Data: Use the object_id from webhook events to fetch the specific updated data
This pattern minimizes API calls while ensuring your application always has the latest data.

Setup Guide
Step 1: Create Your Webhook Endpoint
Set up an HTTP endpoint on your server that can:

Handle both GET requests (for verification) and POST requests (for events)
Respond to verification challenges during subscription setup
Process incoming webhook events quickly (under 10 seconds)
Example endpoint implementation (Node.js):

// Express.js route handlers for your webhook endpoint
app.get('/oura-webhook', (req, res) => {
// Verification handler - required during subscription setup
const { verification_token, challenge } = req.query;

// Verify the token matches your expected token
if (verification_token === YOUR_VERIFICATION_TOKEN) {
// Return the challenge in the required format
return res.json({ challenge });
}

// If verification fails
return res.status(401).send('Invalid verification token');
});

app.post('/oura-webhook', (req, res) => {
// Event handler - processes incoming webhook events

// Always respond quickly (under 10 seconds)
// Process the event asynchronously if needed
res.status(200).send('OK');

// Then process the event data
const { event_type, data_type, object_id, user_id } = req.body;
processEventAsync(event_type, data_type, object_id, user_id);
});
Step 2: Create a Webhook Subscription
Call the POST /v2/webhook/subscription endpoint to register your webhook:

POST /v2/webhook/subscription
Headers:
x-client-id: YOUR_CLIENT_ID
x-client-secret: YOUR_CLIENT_SECRET
Content-Type: application/json

Body:
{
"callback_url": "https://your-server.com/oura-webhook",
"verification_token": "your-secret-verification-token",
"event_type": "update",
"data_type": "sleep"
}
You need to create separate subscriptions for each combination of:

event_type: The type of event (create, update, delete)
data_type: The type of data you're interested in (sleep, activity, etc.)
Step 3: Verification Process
When you create a subscription, Oura verifies your endpoint:

Oura sends a GET request to your callback URL with query parameters:

GET https://your-server.com/oura-webhook?verification_token=your-token&challenge=random-string
Your endpoint must verify the token and respond with the challenge:

{
"challenge": "random-string"
}
If verification succeeds, your subscription is activated

Verification Flow

Step 4: Receiving and Processing Events
When an event occurs (e.g., user syncs new sleep data):

Oura sends a POST request to your callback URL:

POST https://your-server.com/oura-webhook
Headers:
x-oura-signature: HMAC_SIGNATURE
x-oura-timestamp: 1234567890

Body:
{
"event_type": "update",
"data_type": "sleep",
"object_id": "12345abc",
"event_time": "2023-01-01T08:00:00+00:00",
"user_id": "user123"
}
Your endpoint should:

Verify the signature for security (see below)
Respond quickly (under 10 seconds) with a 2xx status
Process the event asynchronously if needed
Use the object_id to fetch the complete data via the API
Security Best Practices
Verify Webhook Signatures
Always verify that webhook requests are actually from Oura by checking the HMAC signature:

const crypto = require('crypto');

function verifySignature(headers, body, clientSecret) {
const signature = headers['x-oura-signature'];
const timestamp = headers['x-oura-timestamp'];

// Create HMAC using your client secret
const hmac = crypto.createHmac('sha256', clientSecret);
hmac.update(timestamp + JSON.stringify(body));
const calculatedSignature = hmac.digest('hex').toUpperCase();

// Compare calculated signature with received signature
return calculatedSignature === signature;
}

// In your webhook handler
app.post('/oura-webhook', (req, res) => {
// Verify signature
if (!verifySignature(req.headers, req.body, CLIENT_SECRET)) {
return res.status(401).send('Invalid signature');
}

// Process valid webhook
res.status(200).send('OK');
// ...
});
Use HTTPS
Always use HTTPS for your webhook endpoint to ensure data is encrypted in transit.

Keep Your Verification Token Secret
Choose a strong, random verification token and don't share it.

Handling Webhook Failures
Retry Mechanism
Oura will retry failed webhook deliveries:

For 4xx responses: 10 retries
For 5xx responses: 10 retries
For timeouts: 10 retries
Canceling Subscriptions
If you want to cancel a subscription, you can:

Use the DELETE endpoint: DELETE /v2/webhook/subscription/{id}
Or respond with a 410 status code to automatically cancel
Common Questions
How quickly will I receive webhooks?
Webhook notifications arrive approximately 30 seconds after data syncs from the mobile app. The timing depends on the data type:

Sleep, Readiness, and other user-initiated sync data: These only sync when the user opens the Oura app and actively syncs their ring
Daily Activity, Daily Stress, and other background data: These may update periodically in the background without user action
What if my server goes down?
Oura will retry webhook deliveries for about an hour if your server doesn't respond properly. However, if your server is down for an extended period, you might miss some events. It's a good practice to implement a reconciliation process that can fetch data for periods when your webhook might have been unavailable.

How can I test webhooks locally?
Use a tool like ngrok to expose your local development server to the internet with a public URL.

Can I use the same callback URL for different subscriptions?
Yes, you can use the same URL for multiple subscriptions. Your handler can differentiate between events using the event_type and data_type fields in the webhook payload.

Will I hit rate limits using webhooks?
We have not had customers hit rate limits with webhooks properly implemented. The recommended pattern is:

Make a single request for historical data when a user first connects
Use webhooks for all ongoing data updates
Only fetch the specific data that has changed based on webhook notifications
This approach minimizes API calls while ensuring your application always has the latest data.

List Webhook Subscriptions
Authorizations:
ClientIdAuthClientSecretAuth
Responses
200 Successful Response

get
/v2/webhook/subscription

Request samples
cURL

Copy
curl --location --request GET 'https://api.ouraring.com/v2/webhook/subscription' --header 'x-client-id: client-id' --header 'x-client-secret: client-secret'
Response samples
200
Content type
application/json

Copy
Expand allCollapse all
[
{
"id": "string",
"callback_url": "string",
"event_type": "create",
"data_type": "tag",
"expiration_time": "2019-08-24T14:15:22Z"
}
]
Create Webhook Subscription
Authorizations:
ClientIdAuthClientSecretAuth
Request Body schema: application/json
callback_url
required
string (Callback Url)
verification_token
required
string (Verification Token)
event_type
required
string (schemas)
Enum: "create" "update" "delete"
data_type
required
string (schemas)
Enum: "tag" "enhanced_tag" "workout" "session" "sleep" "daily_sleep" "daily_readiness" "daily_activity" "daily_spo2" "sleep_time" "rest_mode_period" "ring_configuration" "daily_stress" "daily_cardiovascular_age" "daily_resilience" "vo2_max"
Responses
201 Successful Response
422 Validation Error

post
/v2/webhook/subscription

Request samples
PayloadcURL
Content type
application/json

Copy
Expand allCollapse all
{
"callback_url": "string",
"verification_token": "string",
"event_type": "create",
"data_type": "tag"
}
Response samples
201422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"callback_url": "string",
"event_type": "create",
"data_type": "tag",
"expiration_time": "2019-08-24T14:15:22Z"
}
Get Webhook Subscription
Authorizations:
ClientIdAuthClientSecretAuth
path Parameters
id
required
string (Id)
Responses
200 Successful Response
403 Webhook with specified id does not exist.
422 Validation Error

get
/v2/webhook/subscription/{id}

Request samples
cURL

Copy
curl --location --request GET 'https://api.ouraring.com/v2/webhook/subscription/5d3fe17b-f880-4d93-b9b6-afbfb76c1e78' --header 'x-client-id: client-id' --header 'x-client-secret: client-secret'
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"callback_url": "string",
"event_type": "create",
"data_type": "tag",
"expiration_time": "2019-08-24T14:15:22Z"
}
Update Webhook Subscription
Authorizations:
ClientIdAuthClientSecretAuth
path Parameters
id
required
string (Id)
Request Body schema: application/json
verification_token
required
string (Verification Token)
callback_url
string or null (Callback Url)
event_type
WebhookOperation (string) or null
data_type
ExtApiV2DataType (string) or null
Responses
200 Successful Response
403 Webhook with specified id does not exist.
422 Validation Error

put
/v2/webhook/subscription/{id}

Request samples
PayloadcURL
Content type
application/json

Copy
Expand allCollapse all
{
"verification_token": "string",
"callback_url": "string",
"event_type": "create",
"data_type": "tag"
}
Response samples
200422
Content type
application/json

Copy
Expand allCollapse all
{
"id": "string",
"callback_url": "string",
"event_type": "create",
"data_type": "tag",
"expiration_time": "2019-08-24T14:15:22Z"
}
Delete Webhook Subscription
Authorizations:
ClientIdAuthClientSecretAuth
path Parameters
id
required
string (Id)
Responses
204 Successful Response
403 Webhook with specified id does not exist.
422 Validation Error

delete
/v2/webhook/subscription/{id}

Request samples
cURL

Copy
curl --location --request DELETE 'https://api.ouraring.com/v2/webhook/subscription/5d3fe17b-f880-4d93-b9b6-afbfb76c1e78' --header 'x-client-id: client-id' --header 'x-client-secret: client-secret'
Response samples
422
Content type
application/json

Copy
Expand allCollapse all
{
"detail": [
{}
]
}
Renew Webhook Subscription
Authorizations:
ClientIdAuthClientSecretAuth
path Parameters
id
required
string (Id)
Responses
