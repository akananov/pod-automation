# Pod Leader Automation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Platform-Google%20Apps%20Script-blue.svg)](https://script.google.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%20API-green.svg)](https://ai.google.dev/)

An intelligent automation system that processes meeting transcripts, generates AI-powered summaries, and distributes updates to team members. Built for Google Workspace with Gemini AI integration.

## 🚀 Features

- **Automated Meeting Processing**: Daily discovery and processing of team meetings
- **AI-Powered Analysis**: Gemini AI generates detailed summaries with OKR impact analysis
- **Smart Transcript Search**: Intelligent Google Drive search with performance optimization
- **Professional Output**: Native Google Docs formatting and HTML email styling
- **Multiple Fallback Methods**: Robust document access with comprehensive error handling
- **Performance Optimized**: Smart date filtering and early termination for faster processing
- **Comprehensive Logging**: Detailed execution logs for monitoring and debugging

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🏃 Quick Start

1. **Get your Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Create required Google Docs** (OKR document, Weekly Summary, Transcript Archive)
3. **Set up Google Apps Script** with the provided code
4. **Configure your settings** in the Config file
5. **Run the automation** and set up daily triggers

See [Setup Guide](pod_automation_setup.md) for detailed instructions.

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Gemini AI Integration**: Uses Google's latest Gemini models for intelligent analysis
- **OKR Impact Analysis**: Strategic context analysis showing how discussions align with objectives
- **Dual Summary Generation**: Detailed summaries for emails, concise updates for documents
- **Professional Formatting**: Clean HTML emails and native Google Docs formatting

### 🔍 Smart Meeting Discovery
- **Calendar Integration**: Monitors specified meeting titles automatically
- **Intelligent Filtering**: Only processes new, unprocessed meetings
- **Performance Optimization**: Smart date filtering and early termination
- **Configurable Lookback**: Adjustable time windows for meeting discovery

### 📄 Advanced Document Processing
- **Multiple Access Methods**: DocumentApp, Drive API v3, and fallback methods
- **Native Google Docs Formatting**: Proper headings, bullet points, and professional layout
- **Content Validation**: Robust transcript extraction and cleaning
- **Error Recovery**: Comprehensive fallback mechanisms for reliable operation

### 📧 Professional Communication
- **HTML Email Templates**: Responsive design with professional styling
- **Flexible Distribution**: Send to all participants or pod leader only
- **Clean Content**: No markdown artifacts, professional presentation
- **OKR Context**: Strategic insights in every communication

## 🛠 Installation

### Prerequisites
- Google Workspace account with calendar access
- Google Drive with document creation permissions
- Gemini API key from Google AI Studio

### Setup Steps

1. **Create Google Apps Script Project**
   ```bash
   # Go to script.google.com
   # Create new project: "Pod Leader Automation"
   ```

2. **Add Required Files**
   - Copy `main.js` → `Code.gs` (Main)
   - Copy `pod_config_file.js` → `Config.gs`
   - Copy `debug.js` → `Debug.gs` (optional)

3. **Enable Services**
   - Google Calendar API v3
   - Drive API v3
   - Built-in services: CalendarApp, DocumentApp, DriveApp, MailApp

4. **Grant Permissions**
   - Run `testConfiguration()` function
   - Follow authorization prompts
   - Grant all requested permissions

## ⚙️ Configuration

All configuration is in the `Config.gs` file:

```javascript
// Meeting titles to monitor (must match calendar event titles exactly)
meetingTitles: [
  'Pod Weekly Sync',
  'RHELBU Standup',
  'Team Planning Meeting'
],

// Document IDs (copy from Google Docs URLs)
weeklySummaryDocId: 'your-weekly-summary-doc-id',
transcriptArchiveDocId: 'your-transcript-archive-doc-id',
okrDocumentId: 'your-okr-doc-id',

// AI Configuration
geminiApiKey: 'your-gemini-api-key',
geminiModel: 'gemini-2.5-flash', // or gemini-1.5-pro

// Email Settings
podLeaderEmail: 'your.email@company.com',
emailAllParticipants: false, // true to send to all attendees

// Performance Optimization
transcriptSearchDays: 7, // Search within ±7 days of meeting
meetRecordingsFolderId: '', // Optional: specify folder for faster searches
```

## 📖 Usage

### Daily Automation
```javascript
// Set up daily trigger (runs at 8 AM)
setupDailyTrigger()

// Manual execution
runDailyPodAutomation()
```

### Testing and Debugging
```javascript
// Test configuration and connections
testConfiguration()

// Test with sample meeting
testWithSampleMeeting()

// Debug transcript extraction
debugTranscriptExtraction()

// Clear processed meetings (reprocess all)
clearProcessedMeetings()
```

### Monitoring
- Check execution logs in Apps Script editor
- View detailed logs for each automation run
- Monitor API quota usage and performance

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](pod_automation_setup.md) | Complete installation and configuration guide |
| [Requirements](pod_requirements.md) | Detailed system requirements and specifications |
| [Fixes Guide](COMPREHENSIVE_FIXES_GUIDE.md) | Comprehensive troubleshooting and fixes |
| [Code Organization](CODE_ORGANIZATION_SUMMARY.md) | Code structure and organization overview |

## 🔧 Troubleshooting

### Common Issues

**"No transcript found"**
- Ensure "Take notes for me" is enabled in Google Meet
- Check if Gemini Notes documents are created in Drive
- Run `debugTranscriptExtraction()` for detailed diagnostics

**"Cannot access document"**
- Verify document IDs are correct
- Ensure documents are accessible to your account
- Check document permissions

**"API finished with reason: MAX_TOKENS"**
- Transcript is too long (automatic truncation handles this)
- Consider using `gemini-1.5-pro` for better compression
- Reduce `geminiMaxInputChars` in config

**Email not received**
- Check spam folder
- Verify email addresses in configuration
- Check Apps Script email quotas

### Debug Functions

```javascript
// Comprehensive diagnostics
diagnoseDocumentAccessIssues()

// Test specific document access
testDocumentAccess(docId, 'Document Name')

// Check meeting discovery
debugFindMeetings()

// Test Drive search methods
testDriveSearchMethods()
```

## 🏗 Architecture

### Core Components

```
PodLeaderAutomation/
├── main.js                    # Core automation logic
├── debug.js                   # Debug and testing functions
├── pod_config_file.js         # Configuration settings
├── main_backup.js             # Backup of original code
└── docs/                      # Documentation files
    ├── pod_automation_setup.md
    ├── pod_requirements.md
    ├── COMPREHENSIVE_FIXES_GUIDE.md
    └── CODE_ORGANIZATION_SUMMARY.md
```

### Processing Flow

1. **Discovery**: Find new meetings in calendar
2. **Extraction**: Locate and extract meeting transcripts
3. **Analysis**: Generate AI summaries with OKR context
4. **Documentation**: Update Weekly Summary and Archive
5. **Communication**: Send professional email summaries
6. **Tracking**: Mark meetings as processed

## 🔒 Security

- **API Key Protection**: Store sensitive keys in Script Properties
- **Document Permissions**: Use specific sharing, not public access
- **Email Privacy**: Review attendee lists before distribution
- **Access Control**: Limit document access to necessary users

## 📊 Performance

- **Smart Search**: Date filtering and early termination
- **Optimized Processing**: Maximum 500 files per search
- **Efficient API Usage**: Token limits and truncation handling
- **Parallel Processing**: Multiple fallback methods for reliability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the comprehensive guides in the `docs/` folder
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Debugging**: Use the extensive debug functions in `debug.js`

## 🎯 Roadmap

- [ ] Slack integration for notifications
- [ ] Multiple pod support
- [ ] Custom meeting filters
- [ ] Advanced analytics dashboard
- [ ] Webhook support for external integrations

---

**Built with ❤️ for efficient team collaboration**

*Automate your pod leadership and focus on what matters most - your team's success!*
