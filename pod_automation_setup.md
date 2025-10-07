# Pod Leader Automation - Setup Guide

## Overview
This guide will help you deploy the Pod Leader Automation system in your Google Workspace environment.

## Prerequisites
- Google Workspace account with calendar access
- Google Drive with document creation permissions
- Gemini API key from Google AI Studio

---

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key" or "Create API Key"
3. Copy the generated key (you'll need this for configuration)

---

## Step 2: Create Required Documents

Create three Google Docs that the system will use:

### A. OKR Document
- Create a new Google Doc
- Title it "Team OKRs" (or similar)
- Add your team's Objectives and Key Results
- Copy the document ID from the URL
  - URL format: `https://docs.google.com/document/d/DOCUMENT_ID_HERE/edit`
- **Purpose**: Provides strategic context for AI analysis and OKR Impact sections

### B. Weekly Summary Report
- Create a new Google Doc
- Title it "Weekly Pod Summary"
- The script will automatically create sections for each pod with proper formatting
- Copy the document ID
- **Features**: Native Google Docs formatting with headings, bullet points, and structured layout

### C. Transcript Archive
- Create a new Google Doc
- Title it "Meeting Transcript Archive"
- This will store all historical transcripts with proper headers
- Copy the document ID
- **Purpose**: Complete historical record of all meeting transcripts

**Make sure all three documents are accessible to the script (owned by you or shared with edit access)**

---

## Step 3: Set Up the Google Apps Script

1. **Create a new Apps Script project:**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"
   - Name it "Pod Leader Automation"

2. **Create the Config file:**
   - Click the "+" next to "Files" in the left sidebar
   - Select "Script"
   - Name it `Config`
   - Paste the contents from the "Config.gs" artifact
   - Save (Ctrl+S or Cmd+S)

3. **Update the main Code file:**
   - Click on `Code.gs` in the files list
   - Delete all existing code
   - Paste the contents from the "Pod Leader Automation" artifact
   - Save (Ctrl+S or Cmd+S)
   - Optionally rename to `Main` (click three dots → Rename)

4. **Configure your settings:**
   - Open the `Config.gs` file
   - Update all the settings with your values:
     - Meeting titles to monitor
     - Document IDs (OKR, Weekly Summary, Transcript Archive)
     - Pod name and leader email
     - Gemini API key and model selection
     - Email distribution preferences
     - Performance optimization settings

**File Structure:**
```
📁 Pod Leader Automation Project
├── 📄 Config.gs        ← All configuration (edit this frequently)
└── 📄 Code.gs (Main)   ← Main logic (rarely needs editing)
```

**Benefits of this structure:**
- ✅ Configuration changes don't risk breaking the code
- ✅ Easier to troubleshoot without scrolling past config
- ✅ Can share the main code file without exposing credentials
- ✅ Cleaner organization

---

## Step 4: Enable Required Services

The script uses Google's Advanced Calendar API and Drive API to access meetings and search for Gemini Notes.

1. **In your Apps Script project, click "Services" (+ icon) in the left sidebar**
2. **Add Google Calendar API:**
   - Search for "Calendar"
   - Select "Google Calendar API"
   - Version: v3
   - Identifier: "Calendar"
   - Click "Add"

**Built-in services** (automatically available):
- CalendarApp - Basic calendar access
- DocumentApp - Google Docs reading and formatting
- DriveApp - File searching with optimized performance
- MailApp - Email sending with HTML formatting
- PropertiesService - Data storage for processed meetings tracking

**Advanced features enabled:**
- **Drive API v3**: Enhanced document access with multiple fallback methods
- **Document formatting**: Native Google Docs formatting with proper headings and bullet points
- **Performance optimization**: Smart date filtering and early termination for faster searches
- **Error handling**: Comprehensive error recovery and detailed logging

---

## Step 5: Grant Permissions

1. Click the "Run" button or select `testConfiguration` from the function dropdown
2. Click "Review permissions"
3. Choose your Google account
4. Click "Advanced" → "Go to Pod Leader Automation (unsafe)"
5. Click "Allow"

The script needs these permissions:
- **Calendar**: Read your calendar events and meeting details
- **Drive**: Search for and access Google Docs (including Gemini Notes)
- **Documents**: Read and modify Google Docs with proper formatting
- **Gmail**: Send emails on your behalf with HTML formatting
- **Script Properties**: Store data for processed meetings tracking
- **External Requests**: Make API calls to Gemini AI service

---

## Step 6: Test the Configuration

Run these test functions in order:

### Test 1: Configuration Check
```javascript
// Function dropdown → validateConfiguration → Run
// This checks your Config.gs settings

// Then run:
// Function dropdown → testConfiguration → Run
// This checks API access and document permissions
```
This checks:
- ✓ All required settings are configured
- ✓ Can access all three documents
- ✓ Gemini API key works
- ✓ All configurations are valid

### Test 2: Sample Meeting
```javascript
// Function dropdown → testWithSampleMeeting → Run
```
This will:
- Process a fake meeting with realistic transcript
- Update your documents with proper formatting
- Send a test email with HTML formatting
- Test OKR Impact analysis

Check:
- Did you receive the email with proper HTML formatting?
- Are the documents updated with native Google Docs formatting?
- Does the OKR Impact section appear in the summary?

---

## Step 7: Set Up Daily Automation

1. Run the `setupDailyTrigger` function:
   ```javascript
   // Function dropdown → setupDailyTrigger → Run
   ```

2. This creates a time-based trigger that runs at 8 AM daily

3. To change the time, edit the `setupDailyTrigger` function:
   ```javascript
   .atHour(8)  // Change to desired hour (0-23)
   ```

4. View/manage triggers:
   - Click the clock icon (⏰) in the left sidebar
   - Or go to: Triggers → See all triggers

---

## Step 8: Understanding How Transcripts Are Found

The script searches Google Drive for Gemini Notes documents rather than looking for calendar attachments.

### How Google Meet Saves Gemini Notes

When you use Google Meet's "Take notes for me" feature:
- Google Meet creates a document with a name like: "Meeting Name - YYYY/MM/DD HH:MM TZ - Notes by Gemini"
- This document is saved to your Google Drive (typically in a "Meet Recordings" folder)
- The document is **NOT** automatically attached to the calendar event
- The document is shared with meeting participants

### How the Script Finds Transcripts

The script uses intelligent Drive search with performance optimizations:
1. **Date filtering**: Searches for documents within a configurable date range (default ±7 days)
2. **Pattern matching**: Looks for exact Gemini pattern: `[Meeting Name] - [Date/Time] - Notes by Gemini`
3. **Early termination**: Stops searching when finding a very close match (≤2 hours difference)
4. **Smart filtering**: Skips old documents outside the date range for faster processing
5. **Multiple access methods**: Uses DocumentApp, Drive API v3 export, and fallback methods

### Optional: Specify Your Meet Recordings Folder

For faster searches, you can tell the script which folder contains your Gemini Notes:

1. Open Google Drive
2. Navigate to your "Meet Recordings" folder (or wherever Gemini saves notes)
3. Copy the folder ID from the URL:
   - URL: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
   - ID: `1a2b3c4d5e6f7g8h9i0j`
4. In Config.gs, update:
   ```javascript
   meetRecordingsFolderId: '1a2b3c4d5e6f7g8h9i0j',
   ```

**Leave it empty to search your entire Drive** (slower but finds notes anywhere).

---

## Usage Instructions

### Daily Operation
Once configured, the system runs automatically every day at your scheduled time:
1. Scans calendar for new meetings
2. Processes unprocessed meetings
3. Sends summaries to attendees
4. Updates tracking documents

### Manual Execution
To run manually at any time:
```javascript
// Function dropdown → runDailyPodAutomation → Run
```

### Monitoring
Check the execution logs:
1. Click "Executions" (▶️) in the left sidebar
2. View logs for each run
3. Check for errors or warnings

---

## Managing Your Configuration

All configuration is in the `Config.gs` file. You can safely edit this file without worrying about breaking the automation logic.

### Common Configuration Changes

**Add a new meeting to monitor:**
```javascript
// In Config.gs
meetingTitles: [
  'Pod Weekly Sync',
  'RHELBU Standup',
  'New Meeting Name'  // Add here
],
```

**Change who receives emails:**
```javascript
// Send to all participants
emailAllParticipants: true

// Send only to pod leader (for review)
emailAllParticipants: false
```

**Adjust for longer meetings:**
```javascript
// If meetings are very long (2+ hours)
geminiMaxInputChars: 50000,  // Reduce from 100000
```

**Change the AI model:**
```javascript
// For better quality (slower)
geminiModel: 'gemini-1.5-pro',

// For speed (default)
geminiModel: 'gemini-2.5-flash',

// For experimental features (fastest)
geminiModel: 'gemini-2.0-flash-exp',
```

**Configure transcript search:**
```javascript
// Speed up searches by specifying your Meet Recordings folder
meetRecordingsFolderId: '1a2b3c4d5e6f7g8h9i0j',

// Performance optimization: limit search days (default: 7)
transcriptSearchDays: 7,  // Search within ±7 days of meeting

// Change matching mode
transcriptMatchMode: 'strict',  // Only "Notes by Gemini"
// or
transcriptMatchMode: 'flexible',  // Match custom patterns

// Define custom patterns (for flexible mode)
customTranscriptPatterns: [
  'notes by gemini',
  'meeting notes',
  'your custom pattern'
],
```

### After Changing Config

Always run `validateConfiguration()` to check your changes:
```javascript
// Function dropdown → validateConfiguration → Run
```

---

## Debugging Tips

### View Execution Logs
1. In Apps Script Editor, click "Executions" (▶️) in the left sidebar
2. Click on any execution to see detailed logs
3. Look for errors, warnings, or unexpected behavior

### Common Debugging Scenarios

**Reset and reprocess all meetings:**
```javascript
clearProcessedMeetings()  // Function dropdown → Run
runDailyPodAutomation()   // Run again to reprocess
```

**Test with one specific meeting:**
1. Clear processed meetings
2. Set `lookbackDays: 1` in CONFIG
3. Run `runDailyPodAutomation()`
4. Check logs for that specific meeting

**Test API without processing meetings:**
```javascript
testConfiguration()  // Tests all connections including Gemini API
```

**Check what meetings would be processed:**
```javascript
function debugFindMeetings() {
  const meetings = findNewMeetings();
  Logger.log(`Found ${meetings.length} meetings:`);
  meetings.forEach(m => Logger.log(`- ${m.title} (${m.startTime})`));
}
```
Add this function to your script and run it.

**Test email delivery:**
```javascript
testWithSampleMeeting()  // Sends a test email
```

**Debug transcript extraction:**
```javascript
debugTranscriptExtraction()  // Shows what transcripts are found in your meetings
```
This function checks all monitored meetings and shows:
- Whether Gemini Notes documents are detected
- Transcript length and preview
- Any issues with extraction

### Enable Verbose Logging
Add this at the start of functions for more detailed logs:
```javascript
Logger.log(`Processing meeting: ${JSON.stringify(meeting, null, 2)}`);
```

---

## Troubleshooting

### Problem: "No transcript found"
**Solution:** The script searches Drive for Gemini Notes documents. Common issues:

**1. Gemini Notes not being created:**
- Ensure "Take notes for me" is enabled in Google Meet during meetings
- Verify Gemini is enabled for your Workspace
- Check that notes appear in your Google Drive after meetings

**2. Search not finding documents:**
- Run `debugTranscriptExtraction()` to see search details
- Check if documents are named correctly (should contain "Notes by Gemini")
- Verify documents are created around the meeting time
- Try setting `meetRecordingsFolderId` in Config.gs if notes are in a specific folder

**3. Permission issues:**
- Ensure you have access to the Gemini Notes documents
- Check that documents are shared with your account
- Verify Drive API permissions are granted to the script

**4. Timing issues:**
- Notes are created after the meeting ends
- Wait at least 1-2 hours after a meeting before processing
- Increase `lookbackDays` in config to catch older meetings

**Debug command:**
```javascript
debugTranscriptExtraction()
```
This shows:
- Which meetings are being checked
- Drive search queries being used
- What documents are found
- Why documents are accepted/rejected

### Problem: "Invalid argument: id"
**Solution:** This error indicates a configuration mismatch. Check:

**1. Document ID format:**
- Ensure document IDs are correct (no extra spaces or characters)
- Copy the ID directly from the document URL
- Verify the documents exist and are accessible

**2. Config property names:**
- Use `weeklySummaryDocId` (not `weeklySummaryDocumentId`)
- Use `transcriptArchiveDocId` (not `transcriptArchiveDocumentId`)
- Use `okrDocumentId` (correct)

**3. Test document access:**
```javascript
testDocumentAccess(CONFIG.weeklySummaryDocId, 'Weekly Summary')
testDocumentAccess(CONFIG.transcriptArchiveDocId, 'Transcript Archive')
testDocumentAccess(CONFIG.okrDocumentId, 'OKR Document')
```

### Problem: "Cannot access 'eventTitleLower' before initialization"
**Solution:** This JavaScript error has been fixed in the latest version. If you still see it:

**1. Update to latest code:**
- Replace your main.js with the latest version
- The variable declaration has been moved to the function start

**2. Clear and reprocess:**
```javascript
clearProcessedMeetings()
runDailyPodAutomation()
```

### Problem: "Cannot read properties of undefined (reading 'BULLET')"
**Solution:** This Google Docs formatting error has been fixed. The script now uses:

**1. Native Google Docs formatting:**
- Proper headings instead of markdown
- Bullet characters (•) instead of list items
- Bold text instead of markdown syntax

**2. If you still see this error:**
- Update to the latest code version
- The formatting function has been completely rewritten

### Problem: Raw Markdown showing in Google Docs
**Solution:** The enhanced formatting fix handles this:

**1. Expected behavior:**
- Meeting titles should appear as H3 headings
- Section headers should be bold H4 headings
- Bullet points should use • character
- No raw markdown syntax should appear

**2. If you still see markdown:**
- The AI prompt has been enhanced for cleaner output
- Regex patterns have been improved to handle all variations
- Update to the latest code version

### Problem: "You do not have permission to call DriveApp.getFiles"
**Solution:** This is a permissions issue:

**1. Grant Drive permissions:**
- Look for the lock icon 🔒 in Apps Script editor
- Click "Review permissions"
- Follow the authorization flow
- Grant all requested permissions

**2. Alternative: Use fallback methods:**
- The script has multiple fallback methods for document access
- It will try DocumentApp, Drive API v3 export, and other methods
- Check logs to see which method succeeded

### Problem: "API finished with reason: MAX_TOKENS"
**Solution:** The transcript or summary is too long:

**1. Automatic handling:**
- Script now truncates very long transcripts (100,000+ characters)
- Uses maximum output tokens (8,192)
- Tries to return partial summaries when truncated

**2. Manual adjustments:**
```javascript
// Reduce input length for very long meetings
geminiMaxInputChars: 50000,  // Reduce from 100000

// Use a model with better compression
geminiModel: 'gemini-1.5-pro',  // Better at handling long content
```

### Problem: "Cannot read properties of undefined" (Gemini API)
**Solution:** This is a Gemini API response error:

**1. Check API key:**
- Verify your Gemini API key is correct and not expired
- Check API quotas (15 req/min on free tier)
- Ensure billing is enabled if required

**2. Try different model:**
```javascript
geminiModel: 'gemini-1.5-pro',  // More reliable
// or
geminiModel: 'gemini-2.5-flash',  // Faster
```

**3. Debug API response:**
```javascript
testConfiguration()  // Tests API with simple prompt
```

### Problem: Email not received
**Solution:** Check email delivery:

**1. Check spam folder:**
- Automated emails often go to spam initially
- Add the sender to your contacts

**2. Verify email settings:**
```javascript
// Check if emails are being sent to all participants
emailAllParticipants: false  // Default: only pod leader

// Verify email addresses
podLeaderEmail: 'your.email@company.com'
```

**3. Check Apps Script quotas:**
- Free accounts: 100 emails/day
- Workspace accounts: 1,500 emails/day

### Problem: Performance issues (slow processing)
**Solution:** The script has been optimized, but you can tune it further:

**1. Optimize search parameters:**
```javascript
// Reduce search scope for faster processing
transcriptSearchDays: 3,  // Default: 7

// Specify your Meet Recordings folder
meetRecordingsFolderId: 'your-folder-id',
```

**2. Monitor performance:**
- Check execution logs for processing times
- Look for "Found very close match, stopping search early" messages
- Verify date filtering is working (should skip old files)

### Problem: Meetings not being processed
**Solution:** Check meeting filtering:

**1. Verify meeting titles:**
```javascript
// Check your meeting titles match exactly
meetingTitles: [
  'RHEL Cloud Pod Program Call',  // Must match calendar event title exactly
  'RHEL Cloud Pod Core Team - Strategy and Journeys'
],
```

**2. Check lookback period:**
```javascript
lookbackDays: 15,  // Increase if meetings are older
```

**3. Debug meeting discovery:**
```javascript
// Add this function to see what meetings are found
function debugFindMeetings() {
  const meetings = findNewMeetings();
  Logger.log(`Found ${meetings.length} meetings:`);
  meetings.forEach(m => Logger.log(`- ${m.title} (${m.startTime})`));
}
```

### Problem: Documents not updating with proper formatting
**Solution:** The enhanced formatting should handle this:

**1. Expected formatting:**
- Meeting titles as H3 headings
- Section headers as bold H4 headings
- Bullet points with • character
- Clean, professional layout

**2. If formatting is still wrong:**
- Update to the latest code version
- The formatting function has been completely rewritten
- Test with `testWithSampleMeeting()` to verify formatting

### Comprehensive Debugging

**Run these functions in order for complete diagnostics:**

```javascript
// 1. Test all connections
testConfiguration()

// 2. Test document access
testDocumentAccess(CONFIG.weeklySummaryDocId, 'Weekly Summary')
testDocumentAccess(CONFIG.transcriptArchiveDocId, 'Transcript Archive')
testDocumentAccess(CONFIG.okrDocumentId, 'OKR Document')

// 3. Test transcript extraction
debugTranscriptExtraction()

// 4. Test with sample meeting
testWithSampleMeeting()

// 5. Run full automation
runDailyPodAutomation()
```

**Check execution logs for detailed information about each step.**

### Problem: "Cannot access document"
**Solution:**
- Verify document IDs are correct
- Ensure documents are accessible to your account
- Check document permissions

### Problem: "Gemini API Error"
**Solution:**
- Verify API key is correct
- Check you have API quota remaining
- Ensure billing is enabled (if required)
- Try a different model: `gemini-1.5-pro` or `gemini-1.5-flash`

### Problem: Meeting already processed
**Solution:** The script tracks processed meetings. To reprocess:
```javascript
clearProcessedMeetings()  // Run this function
```

You can also do this via the Apps Script editor:
1. Select `clearProcessedMeetings` from the function dropdown
2. Click "Run"
3. All meetings will be eligible for reprocessing

### Problem: "API finished with reason: MAX_TOKENS"
**This means the transcript or summary is too long. Solutions:**
1. **Automatic handling**: The script now increases token limits and truncates very long transcripts
2. **Split long meetings**: If meetings are >2 hours, consider splitting the transcript
3. **Shorten OKR document**: A very long OKR doc uses up context space
4. **Use gemini-1.5-pro**: Has better handling of long content
5. **Check partial output**: The system will try to return partial summaries when truncated

The script now automatically truncates transcripts over 100,000 characters and allows up to 8,192 output tokens.

### Problem: "Cannot read properties of undefined"

### Problem: "Cannot read properties of undefined"
**This is a Gemini API response error. Solutions:**
1. **Check your API key**: Ensure it's valid and not expired
2. **Check API quotas**: You may have hit rate limits (15 req/min on free tier)
3. **Review the logs**: The improved error handling now logs the full response
4. **Try a different model**: Switch to `gemini-1.5-pro` or `gemini-1.5-flash`
5. **Check prompt length**: Very long transcripts may exceed token limits
6. **Wait and retry**: Temporary API issues may resolve themselves

**To debug:**
```javascript
// Run testConfiguration to test the API with a simple prompt
testConfiguration()
```

Check the execution logs for detailed error information including the actual API response.

### Problem: Email not received
**Solution:**
- Check spam folder
- Verify email addresses in CONFIG
- Check Apps Script quotas (100 emails/day for free accounts)

---

## Advanced Configuration

### Email Distribution Control
Control who receives the meeting summaries:

```javascript
// Send only to pod leader (default - safer for review first)
emailAllParticipants: false

// Send to all meeting participants + pod leader
emailAllParticipants: true
```

**Default is pod-leader-only for safety:**
- Review summaries before wider distribution
- Test the system with real meetings
- Handle sensitive meetings appropriately
- Manually forward after review and approval

**Switch to `true` when ready for full automation**

### Adjust Token Limits for Long Transcripts
Control how the AI handles long content:

```javascript
// Maximum tokens the AI can output (default: 8192, max: 8192)
geminiMaxOutputTokens: 8192

// Truncate transcripts longer than this (default: 100000 characters)
geminiMaxInputChars: 100000
```

**If you have very long meetings (2+ hours):**
- Reduce `geminiMaxInputChars` to 50000 for faster processing
- Or split transcripts into multiple shorter meetings

**If summaries are getting cut off:**
- Already at maximum (8192 tokens)
- Try using more concise OKR documents
- Consider using `gemini-1.5-pro` for better compression

### Change AI Prompts
Edit the `generateDetailedSummary` and `generateConciseSummary` functions to customize the AI analysis.

### Change Email Format
Modify the `sendSummaryEmail` function to adjust the email template.

### Add More Document Sections
Extend the `updateWeeklySummary` function to add custom sections.

### Filter Specific Attendees
Modify the `sendSummaryEmail` function to filter certain email addresses.

---

## Maintenance

### Weekly Tasks
- Check execution logs for errors
- Verify documents are updating correctly
- Review email deliverability

### Monthly Tasks
- Review processed meetings count
- Check API quota usage
- Verify trigger is still active

### As Needed
- Update meeting titles in CONFIG
- Refresh OKR document
- Add new team members to email lists

---

## Limits and Quotas

**Google Apps Script Limits:**
- 6 minutes maximum execution time per run
- 100 emails per day (consumer accounts)
- 1,500 emails per day (Workspace accounts)

**Gemini API Limits:**
- Free tier: 15 requests per minute
- Check current quotas: [Google AI Studio](https://aistudio.google.com/app/apikey)

---

## Security Best Practices

1. **API Key Security:**
   - Keep your `Config.gs` file private - it contains your API key
   - Never share screenshots of your Config.gs file
   - For production deployments, consider using Script Properties:
   ```javascript
   // In Config.gs, replace:
   geminiApiKey: 'YOUR_KEY_HERE',
   // With:
   geminiApiKey: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
   
   // Then set the property once:
   // Tools → Script editor → Project Settings → Script Properties → Add
   ```

2. **Document Access:**
   - Ensure sensitive documents have appropriate permissions
   - Use specific sharing, not "anyone with link"

3. **Email Privacy:**
   - Review attendee lists before enabling `emailAllParticipants: true`
   - Consider filtering external email addresses
   - Test with `emailAllParticipants: false` first

4. **Sharing the Script:**
   - You can safely share `Code.gs` (Main) - it contains no credentials
   - Never share `Config.gs` - it contains API keys and email addresses
   - When sharing, provide a template Config.gs with placeholder values

---

## Support and Resources

- **Google Apps Script Docs:** https://developers.google.com/apps-script
- **Gemini API Docs:** https://ai.google.dev/docs
- **Calendar API Reference:** https://developers.google.com/apps-script/reference/calendar

---

## Quick Reference: Key Functions

| Function | Purpose | File |
|----------|---------|------|
| `runDailyPodAutomation()` | Main automation - run this daily | Main |
| `validateConfiguration()` | Check Config.gs settings are valid | Config |
| `testConfiguration()` | Test all connections and API access | Main |
| `setupDailyTrigger()` | Set up automatic daily execution | Main |
| `testWithSampleMeeting()` | Process a test meeting | Main |
| `debugTranscriptExtraction()` | Check if transcripts are being found | Main |
| `clearProcessedMeetings()` | Reset tracking (reprocess all meetings) | Main |

---

## Customization Examples

### Example 1: Multiple Pods
```javascript
const PODS = [
  {
    name: 'Engineering Alpha',
    meetings: ['Alpha Standup', 'Alpha Planning'],
    leader: 'alpha.lead@company.com'
  },
  {
    name: 'Engineering Beta',
    meetings: ['Beta Standup', 'Beta Planning'],
    leader: 'beta.lead@company.com'
  }
];
```

### Example 2: Slack Integration
Add webhook to send notifications:
```javascript
function sendSlackNotification(message) {
  const webhook = 'YOUR_SLACK_WEBHOOK_URL';
  UrlFetchApp.fetch(webhook, {
    method: 'post',
    payload: JSON.stringify({ text: message })
  });
}
```

### Example 3: Custom Meeting Filters
```javascript
function shouldProcessMeeting(event) {
  // Only process meetings with 3+ attendees
  return event.getGuestList().length >= 3;
}
```

---

Ready to automate your pod leadership! 🚀