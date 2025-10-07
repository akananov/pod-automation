// ========================================
// CONFIGURATION FILE
// ========================================
// This file contains all configuration settings.
// Edit this file to customize the automation for your team.
// The main code file does not need to be modified.

const CONFIG = {
  // ========================================
  // MEETING SETTINGS
  // ========================================
  
  // Meeting identifiers to monitor (case-insensitive partial match)
  // The script will process any calendar event whose title contains one of these strings
  meetingTitles: [
    'Pod Weekly Sync',
    'RHELBU Standup',
    'Team Planning Meeting'
  ],
  
  // Number of days to look back for meetings
  // Set to 1 for daily processing, 3-7 for catching up on missed days
  lookbackDays: 3,
  
  // Maximum days to search for transcript files (relative to meeting date)
  // Prevents searching through very old transcript files
  transcriptSearchDays: 7,
  
  // ========================================
  // GOOGLE DOCS CONFIGURATION
  // ========================================
  
  // Get document IDs from the URLs:
  // https://docs.google.com/document/d/DOCUMENT_ID_HERE/edit
  
  // Document containing your team's OKRs (provides context for AI analysis)
  okrDocumentId: 'YOUR_OKR_DOCUMENT_ID_HERE',
  
  // Document for weekly summary updates (AI-generated concise summaries)
  weeklySummaryDocId: 'YOUR_WEEKLY_SUMMARY_DOC_ID_HERE',
  
  // Document for full transcript archive (stores complete meeting transcripts)
  transcriptArchiveDocId: 'YOUR_TRANSCRIPT_ARCHIVE_DOC_ID_HERE',
  
  // ========================================
  // TEAM INFORMATION
  // ========================================
  
  // Your pod/team name (used in weekly summary document sections)
  podName: 'Engineering Pod Alpha',
  
  // Pod leader email (receives all summaries and error notifications)
  podLeaderEmail: 'pod.leader@company.com',
  
  // ========================================
  // AI CONFIGURATION (Google Gemini)
  // ========================================
  
  // Get your API key from: https://aistudio.google.com/app/apikey
  geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE',
  
  // Model to use for AI analysis
  // Options: 'gemini-2.0-flash-exp' (fastest), 'gemini-1.5-pro' (most capable)
  geminiModel: 'gemini-2.0-flash-exp',
  
  // Maximum tokens for AI responses (max: 8192)
  // Increase if summaries are getting cut off
  geminiMaxOutputTokens: 8192,
  
  // Maximum transcript length in characters (truncated if longer)
  // Reduce if API calls are timing out or hitting token limits
  geminiMaxInputChars: 100000,
  
  // ========================================
  // TRANSCRIPT DETECTION SETTINGS
  // ========================================
  
  // Drive folder ID where Google Meet saves Gemini Notes
  // Leave empty to search entire Drive (slower)
  // To get folder ID: Open folder in Drive, copy ID from URL
  // URL format: https://drive.google.com/drive/folders/FOLDER_ID_HERE
  meetRecordingsFolderId: '', // Optional: 'YOUR_MEET_RECORDINGS_FOLDER_ID'
  
  // Pattern matching mode for finding transcripts:
  // 'strict': Only match "Notes by Gemini" documents (default)
  // 'flexible': Match any document with "notes" in the title
  transcriptMatchMode: 'strict',
  
  // Custom patterns to match for transcript documents (case-insensitive)
  // Only used when transcriptMatchMode is 'flexible'
  customTranscriptPatterns: [
    'notes by gemini',
    'gemini notes', 
    'meeting notes',
    'notes - cloud pod',
    'notes - rhel'
  ],
  
  // ========================================
  // EMAIL SETTINGS
  // ========================================
  
  // Prefix for email subject lines
  emailSubjectPrefix: '[Pod Update]',
  
  // Email distribution mode:
  // false = Send only to pod leader (safer for testing/review)
  // true = Send to all meeting participants + pod leader (full automation)
  emailAllParticipants: false,
  
  // ========================================
  // AI PROMPTS & MESSAGES
  // ========================================
  
  // Customize the AI prompts used for generating summaries
  // You can modify these to change the tone, format, or focus of the AI analysis
  
  // Prompt for detailed HTML summary (used in email)
  detailedSummaryPrompt: 
    'You are an executive assistant analyzing a team meeting transcript. Generate a comprehensive summary that includes these sections:\n\n' +
    'EXECUTIVE OVERVIEW:\n' +
    '[2-3 sentence overview of the meeting\'s main purpose and outcomes]\n\n' +
    'KEY DECISIONS MADE:\n' +
    '[List all major decisions with context]\n\n' +
    'ACTION ITEMS:\n' +
    '[List all action items with owners and deadlines]\n\n' +
    'DISCUSSION HIGHLIGHTS:\n' +
    '[Key discussion points and insights]\n\n' +
    'OKR IMPACT:\n' +
    '[Analysis of how the discussion and decisions align with the team\'s OKRs. Reference specific objectives and key results.]\n\n' +
    'IMPORTANT: Provide ONLY the content above without any markdown formatting, code blocks, or HTML tags. Use clear section headers in ALL CAPS followed by the content.\n\n' +
    'Meeting Transcript:\n{TRANSCRIPT}\n\n' +
    'OKR Context:\n{OKR_CONTEXT}',
  
  // Prompt for concise summary (used in weekly summary document)
  conciseSummaryPrompt:
    'Generate a concise summary of this meeting transcript with these sections:\n\n' +
    'HIGHLIGHTS:\n' +
    '[List key positive outcomes and achievements]\n\n' +
    'LOW LIGHTS:\n' +
    '[List challenges, issues, or concerns raised]\n\n' +
    'MAIN OUTCOMES:\n' +
    '[List the primary results and deliverables]\n\n' +
    'DECISIONS:\n' +
    '[List all decisions made and action items assigned]\n\n' +
    'OKR IMPACT:\n' +
    '[List how the meeting impacts team OKRs and objectives]\n\n' +
    'IMPORTANT: Use clear section headers in ALL CAPS followed by bullet points. Keep each point concise (1-2 sentences max). Focus on the most important information from the meeting.\n\n' +
    'Meeting Transcript:\n{TRANSCRIPT}',
  
  // Email footer messages
  emailFooterMessage: 'This summary was automatically generated by the Pod Leader Automation system.',
  emailContactMessage: 'Questions? Contact {POD_LEADER_EMAIL}',
  
  // Error notification messages
  errorNotificationHeader: 'An error occurred in the Pod Leader Automation system:',
  errorNotificationFooter: 'Please check the Apps Script logs for more details.',
  
  // ========================================
  // ADVANCED SETTINGS
  // ========================================
  
  // Properties key for tracking processed meetings (don't change unless needed)
  processedMeetingsKey: 'PROCESSED_MEETINGS'
};

// ========================================
// CONFIGURATION VALIDATION
// ========================================

/**
 * Validates the configuration settings
 * Run this function to check if your config is set up correctly
 */
function validateConfiguration() {
  Logger.log('=== Validating Configuration ===');
  
  const errors = [];
  const warnings = [];
  
  // Check meeting titles
  if (!CONFIG.meetingTitles || CONFIG.meetingTitles.length === 0) {
    errors.push('No meeting titles configured');
  }
  
  // Check document IDs
  if (CONFIG.okrDocumentId === 'YOUR_OKR_DOCUMENT_ID_HERE') {
    warnings.push('OKR document ID not set');
  }
  if (CONFIG.weeklySummaryDocId === 'YOUR_WEEKLY_SUMMARY_DOC_ID_HERE') {
    errors.push('Weekly summary document ID not set');
  }
  if (CONFIG.transcriptArchiveDocId === 'YOUR_TRANSCRIPT_ARCHIVE_DOC_ID_HERE') {
    errors.push('Transcript archive document ID not set');
  }
  
  // Check email
  if (!CONFIG.podLeaderEmail || CONFIG.podLeaderEmail === 'pod.leader@company.com') {
    errors.push('Pod leader email not set');
  }
  
  // Check API key
  if (CONFIG.geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    errors.push('Gemini API key not set');
  }
  
  // Check numeric values
  if (CONFIG.lookbackDays < 1 || CONFIG.lookbackDays > 30) {
    warnings.push('Lookback days should be between 1 and 30');
  }
  
  if (CONFIG.geminiMaxOutputTokens > 8192) {
    warnings.push('Max output tokens exceeds Gemini limit (8192)');
  }
  
  // Display results
  if (errors.length > 0) {
    Logger.log('❌ ERRORS:');
    errors.forEach(err => Logger.log(`  - ${err}`));
  }
  
  if (warnings.length > 0) {
    Logger.log('⚠️  WARNINGS:');
    warnings.forEach(warn => Logger.log(`  - ${warn}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    Logger.log('✅ Configuration looks good!');
  }
  
  Logger.log('=== Validation Complete ===');
  
  return { errors, warnings };
}