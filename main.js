// POD LEADER AUTOMATION SYSTEM - MAIN CODE
// ========================================
// Daily automation for processing meeting transcripts, generating AI summaries,
// and distributing updates to team members.
//
// CONFIGURATION: All settings are in Config.gs file
// This file contains only the automation logic

// ========================================
// MAIN ORCHESTRATION FUNCTION
// ========================================
function runDailyPodAutomation() {
  Logger.log('=== Starting Pod Leader Automation ===');
  
  try {
    // Phase 1: Discovery & Filtering
    const newMeetings = findNewMeetings();
    
    if (newMeetings.length === 0) {
      Logger.log('No new meetings found to process.');
      return;
    }
    
    Logger.log(`Found ${newMeetings.length} new meeting(s) to process.`);
    
    // Phase 2: Process each new meeting
    let successCount = 0;
    let failCount = 0;
    
    for (const meeting of newMeetings) {
      try {
        Logger.log(`Processing: ${meeting.title} (${meeting.startTime})`);
        processMeeting(meeting);
        markMeetingAsProcessed(meeting.id);
        successCount++;
        Logger.log(`✓ Successfully processed: ${meeting.title}`);
      } catch (error) {
        Logger.log(`✗ Error processing ${meeting.title}: ${error.message}`);
        failCount++;
      }
    }
    
    // Phase 3: Summary
    Logger.log(`\n=== Automation Complete ===`);
    Logger.log(`✓ Successfully processed: ${successCount} meetings`);
    if (failCount > 0) {
      Logger.log(`✗ Failed to process: ${failCount} meetings`);
    }
    
  } catch (error) {
    Logger.log(`✗ Automation failed: ${error.message}`);
    sendErrorNotification('Daily Pod Automation Failed', error.message);
  }
}

// ========================================
// PHASE 1: MEETING DISCOVERY
// ========================================
function findNewMeetings() {
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const startDate = new Date(now.getTime() - (CONFIG.lookbackDays * 24 * 60 * 60 * 1000));
  const endDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Include tomorrow
  
  Logger.log(`Looking for meetings from ${startDate} to ${endDate}`);
  
  const events = calendar.getEvents(startDate, endDate);
  const newMeetings = [];
  
  for (const event of events) {
    const eventTitle = event.getTitle();
    const eventStart = event.getStartTime();
    
    // Skip if already processed
    if (isMeetingProcessed(event.getId())) {
      continue;
    }
    
    // Skip if not a relevant meeting
    if (!isRelevantMeeting(eventTitle)) {
      Logger.log(`Skipping irrelevant meeting: "${eventTitle}"`);
      continue;
    }
    
    Logger.log(`\n========================================`);
    Logger.log(`Meeting: ${eventTitle}`);
    Logger.log(`Date: ${eventStart}`);
    Logger.log(`========================================`);
    
    // Search Drive for transcript matching this meeting
    const transcript = findTranscriptInDrive(event);
    if (!transcript) {
      const dateStr = Utilities.formatDate(event.getStartTime(), Session.getScriptTimeZone(), 'MMM dd, yyyy hh:mm a');
      Logger.log(`Skipping ${eventTitle} (${dateStr}): No transcript found`);
      continue;
    }
    
    // Create meeting object
    const meeting = {
      id: event.getId(),
      title: eventTitle,
      startTime: eventStart,
      endTime: event.getEndTime(),
      transcript: transcript,
      attendees: event.getGuestList().map(guest => guest.getEmail())
    };
    
    newMeetings.push(meeting);
  }
  
  return newMeetings;
}

function isRelevantMeeting(title) {
  // Check if the meeting title matches any of the configured meeting titles
  if (CONFIG.meetingTitles && CONFIG.meetingTitles.length > 0) {
    return CONFIG.meetingTitles.some(meetingTitle => 
      title.toLowerCase().includes(meetingTitle.toLowerCase())
    );
  }
  
  // Fallback to keyword matching if meetingTitles is not configured
  const relevantKeywords = CONFIG.customTranscriptPatterns || ['RHEL', 'Cloud Pod', 'Strategy', 'Journey'];
  return relevantKeywords.some(keyword => title.toLowerCase().includes(keyword.toLowerCase()));
}

function isMeetingProcessed(meetingId) {
  const properties = PropertiesService.getScriptProperties();
  const key = CONFIG.processedMeetingsKey || 'PROCESSED_MEETINGS';
  const processedMeetings = JSON.parse(properties.getProperty(key) || '[]');
  return processedMeetings.includes(meetingId);
}

function markMeetingAsProcessed(meetingId) {
  const properties = PropertiesService.getScriptProperties();
  const key = CONFIG.processedMeetingsKey || 'PROCESSED_MEETINGS';
  const processedMeetings = JSON.parse(properties.getProperty(key) || '[]');
  processedMeetings.push(meetingId);
  properties.setProperty(key, JSON.stringify(processedMeetings));
}

// ========================================
// TRANSCRIPT SEARCH FUNCTIONS
// ========================================
function findTranscriptInDrive(event) {
  const eventTitle = event.getTitle();
  const eventStart = event.getStartTime();
  
  Logger.log(`\n--- Searching Drive for transcript ---`);
  Logger.log(`Meeting: ${eventTitle}`);
  Logger.log(`Start time: ${eventStart}`);
  
  // Convert meeting title to lowercase for comparison
  const eventTitleLower = eventTitle.toLowerCase();
  
  try {
    // Check Drive permissions first
    if (!hasDrivePermissions()) {
      Logger.log(`Warning: Drive permissions not available. Trying alternative search methods...`);
      return findTranscriptAlternative(event);
    }
    
    // Get all Google Docs
    let files;
    if (CONFIG.meetRecordingsFolderId) {
      try {
        const folder = DriveApp.getFolderById(CONFIG.meetRecordingsFolderId);
        files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
        Logger.log(`Searching in folder: ${CONFIG.meetRecordingsFolderId}`);
      } catch (folderError) {
        Logger.log(`Could not access folder ${CONFIG.meetRecordingsFolderId}: ${folderError.message}`);
        Logger.log(`Falling back to entire Drive search...`);
        files = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
      }
    } else {
      files = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
      Logger.log(`Searching entire Drive`);
    }
    
    // Debug: Log some sample files to understand what we're getting
    Logger.log(`\n=== DRIVE SEARCH DEBUG ===`);
    let sampleCount = 0;
    const sampleFiles = [];
    const tempFiles = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    
    while (tempFiles.hasNext() && sampleCount < 10) {
      const sampleFile = tempFiles.next();
      sampleFiles.push(sampleFile.getName());
      sampleCount++;
    }
    
    Logger.log(`Sample of first 10 Google Docs found:`);
    sampleFiles.forEach((fileName, index) => {
      Logger.log(`  ${index + 1}. "${fileName}"`);
    });
    
    // Check if any sample files start with meeting title
    const meetingFiles = sampleFiles.filter(file => 
      file.toLowerCase().startsWith(eventTitleLower)
    );
    
    if (meetingFiles.length > 0) {
      Logger.log(`Found ${meetingFiles.length} files starting with meeting title in first 10:`);
      meetingFiles.forEach(file => Logger.log(`  - "${file}"`));
    } else {
      Logger.log(`No files starting with meeting title found in first 10 files`);
    }
    
    const candidates = [];
    
    // Calculate reasonable date range for filtering (meeting date ± configured days)
    const searchDays = CONFIG.transcriptSearchDays || 7;
    const searchStartDate = new Date(eventStart.getTime() - (searchDays * 24 * 60 * 60 * 1000));
    const searchEndDate = new Date(eventStart.getTime() + (searchDays * 24 * 60 * 60 * 1000));
    
    Logger.log(`Filtering candidates within date range: ${searchStartDate} to ${searchEndDate}`);
    
    // Look for files that match transcript patterns
    let filesProcessed = 0;
    const maxFilesToProcess = 500; // Increased limit to find more files
    let matchingFiles = [];
    
    const matchMode = CONFIG.transcriptMatchMode || 'strict';
    const patterns = CONFIG.customTranscriptPatterns || ['notes by gemini'];
    
    Logger.log(`Searching for files starting with: "${eventTitle}"`);
    if (matchMode === 'strict') {
      Logger.log(`And ending with: "Notes by Gemini"`);
    } else {
      Logger.log(`And containing patterns: ${patterns.join(', ')}`);
    }
    
    while (files.hasNext() && filesProcessed < maxFilesToProcess) {
      const file = files.next();
      filesProcessed++;
      const fileName = file.getName();
      const fileNameLower = fileName.toLowerCase();
      
      // Debug: Log every file that starts with the meeting title
      if (fileNameLower.startsWith(eventTitleLower)) {
        Logger.log(`Found file starting with meeting title: "${fileName}"`);
        matchingFiles.push(fileName);
      }
      
      // Check if filename starts with meeting title and matches transcript patterns
      const startsWithMeeting = fileNameLower.startsWith(eventTitleLower);
      let matchesPattern = false;
      
      if (matchMode === 'strict') {
        // Strict mode: must end with "Notes by Gemini"
        matchesPattern = fileNameLower.endsWith('notes by gemini');
      } else {
        // Flexible mode: must contain any of the custom patterns
        matchesPattern = patterns.some(pattern => 
          fileNameLower.includes(pattern.toLowerCase())
        );
      }
      
      // Debug: Log the matching logic
      if (startsWithMeeting) {
        Logger.log(`File "${fileName}" starts with meeting title: ${startsWithMeeting}`);
        Logger.log(`File "${fileName}" matches pattern: ${matchesPattern}`);
      }
      
      if (startsWithMeeting && matchesPattern) {
        const fileModified = file.getLastUpdated();
        
        // Skip files that are too old (more than configured days before meeting)
        if (fileModified < searchStartDate) {
          Logger.log(`Skipping old candidate: "${fileName}" (too old: ${fileModified})`);
          continue;
        }
        
        // Skip files that are too new (more than configured days after meeting)
        if (fileModified > searchEndDate) {
          Logger.log(`Skipping future candidate: "${fileName}" (too new: ${fileModified})`);
          continue;
        }
        
        Logger.log(`Found candidate: "${fileName}" (modified: ${fileModified})`);
        
        candidates.push({
          file: file,
          name: fileName,
          modified: fileModified,
          timeDiff: Math.abs(fileModified - eventStart)
        });
        
        // If we find a very close match (within 2 hours), stop searching
        const hoursDiff = Math.abs(fileModified - eventStart) / (1000 * 60 * 60);
        if (hoursDiff <= 2) {
          Logger.log(`Found very close match (${hoursDiff.toFixed(1)} hours), stopping search early`);
          break;
        }
      }
    }
    
    if (filesProcessed >= maxFilesToProcess) {
      Logger.log(`Processed ${filesProcessed} files, stopping to prevent excessive processing`);
    }
    
    // Debug: Log summary of what was found
    Logger.log(`\n=== SEARCH SUMMARY ===`);
    Logger.log(`Files processed: ${filesProcessed}`);
    Logger.log(`Files starting with meeting title: ${matchingFiles.length}`);
    if (matchingFiles.length > 0) {
      Logger.log(`Matching files:`);
      matchingFiles.forEach(file => Logger.log(`  - "${file}"`));
    }
    Logger.log(`Final candidates found: ${candidates.length}`);
    
    if (candidates.length === 0) {
      Logger.log(`No matching documents found`);
      Logger.log(`Looking for files starting with: "${eventTitle}"`);
      if (matchMode === 'strict') {
        Logger.log(`And ending with: "Notes by Gemini"`);
        Logger.log(`Gemini transcripts follow pattern: [Meeting Name] - [Date/Time] - Notes by Gemini`);
      } else {
        Logger.log(`And containing patterns: ${patterns.join(', ')}`);
      }
      return null;
    }
    
    // Sort by closest time to event start
    candidates.sort((a, b) => a.timeDiff - b.timeDiff);
    
    // Get the closest match
    const bestMatch = candidates[0];
    const hoursDiff = bestMatch.timeDiff / (1000 * 60 * 60);
    
    Logger.log(`✓ Best match: "${bestMatch.name}" (${hoursDiff.toFixed(1)} hours difference)`);
    
    // Extract content from the best match
    return extractDocumentContent(bestMatch.file);
    
  } catch (error) {
    Logger.log(`Error searching Drive: ${error.message}`);
    return null;
  }
}

function findTranscriptAlternative(event) {
  Logger.log(`\n--- Alternative transcript search (no Drive API) ---`);
  Logger.log(`Meeting: ${event.getTitle()}`);
  Logger.log(`Start time: ${event.getStartTime()}`);
  
  // Method 1: Check event description for transcript content
  const description = event.getDescription();
  if (description && description.length > 500) {
    Logger.log(`Found long description (${description.length} characters), using as transcript`);
    return description;
  }
  
  // Method 2: Look for Google Doc links in description
  const docLinkPattern = /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/g;
  let match;
  while ((match = docLinkPattern.exec(description)) !== null) {
    const docId = match[1];
    Logger.log(`Found Google Doc link in description: ${docId}`);
    
    try {
      const content = extractDocumentContent(DriveApp.getFileById(docId));
      if (content && content.length > 100) {
        Logger.log(`✓ Successfully extracted content from linked document (${content.length} characters)`);
        return content;
      }
    } catch (error) {
      Logger.log(`Could not access linked document: ${error.message}`);
    }
  }
  
  // Method 3: Pattern matching in title/description
  const title = event.getTitle();
  const searchText = `${title} ${description}`.toLowerCase();
  
  const transcriptIndicators = ['transcript', 'notes', 'summary', 'minutes', 'meeting notes'];
  const hasTranscriptIndicator = transcriptIndicators.some(indicator => 
    searchText.includes(indicator)
  );
  
  if (hasTranscriptIndicator && description.length > 200) {
    Logger.log(`Found transcript indicators in event, using description as transcript`);
    return description;
  }
  
  Logger.log(`No transcript found using alternative methods`);
  return null;
}

function hasDrivePermissions() {
  try {
    DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    return true;
  } catch (error) {
    return false;
  }
}

function extractDocumentContent(file) {
  const fileId = file.getId();
  const fileName = file.getName();
  const mimeType = file.getMimeType();
  
  Logger.log(`Attempting to open document with ID: ${fileId}`);
  Logger.log(`File MIME type: ${mimeType}`);
  
  // Method 1: Try DocumentApp (preferred for Google Docs)
  try {
    Logger.log(`Trying DocumentApp.openById...`);
    const doc = DocumentApp.openById(fileId);
    const content = doc.getBody().getText();
    
    if (isValidTextContent(content)) {
      Logger.log(`✓ DocumentApp method successful (${content.length} characters)`);
      Logger.log(`Content preview: ${content.substring(0, 100)}...`);
      return content;
    } else {
      Logger.log(`⚠ DocumentApp method returned invalid content`);
    }
  } catch (error) {
    Logger.log(`DocumentApp method failed: ${error.message}`);
  }
  
  // Method 2: Try Drive API v3 export (text)
  try {
    Logger.log(`Trying Drive API v3 export method...`);
    const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`
      }
    });
    
    const content = response.getContentText();
    
    if (isValidTextContent(content)) {
      Logger.log(`✓ Drive API v3 export method successful (${content.length} characters)`);
      Logger.log(`Content preview: ${content.substring(0, 100)}...`);
      return content;
    } else {
      Logger.log(`⚠ Drive API v3 export method returned invalid content`);
    }
  } catch (error) {
    Logger.log(`Drive API v3 export method failed: ${error.message}`);
  }
  
  // Method 3: Try Drive API v3 export (HTML)
  try {
    Logger.log(`Trying Drive API v3 HTML export method...`);
    const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=html`;
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`
      }
    });
    
    const htmlContent = response.getContentText();
    const content = extractTextFromHtml(htmlContent);
    
    if (isValidTextContent(content)) {
      Logger.log(`✓ Drive API v3 HTML export method successful (${content.length} characters)`);
      Logger.log(`Content preview: ${content.substring(0, 100)}...`);
      return content;
    } else {
      Logger.log(`⚠ Drive API v3 HTML export method returned invalid content`);
    }
  } catch (error) {
    Logger.log(`Drive API v3 HTML export method failed: ${error.message}`);
  }
  
  // Method 4: Try alternative Drive API export
  try {
    Logger.log(`Trying alternative Drive API export method...`);
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`
      }
    });
    
    const content = response.getContentText();
    
    if (isValidTextContent(content)) {
      Logger.log(`✓ Alternative Drive API export method successful (${content.length} characters)`);
      Logger.log(`Content preview: ${content.substring(0, 100)}...`);
      return content;
    } else {
      Logger.log(`⚠ Alternative Drive API export method returned invalid content`);
    }
  } catch (error) {
    Logger.log(`Alternative Drive API export method failed: ${error.message}`);
  }
  
  Logger.log(`All document access methods failed`);
  return null;
}

function isValidTextContent(content) {
  if (!content || content.length < 10) {
    return false;
  }
  
  // Check for binary indicators
  const binaryIndicators = ['%PDF', 'PK\x03\x04', '\x89PNG', 'GIF8', 'JFIF', 'BM\x00\x00', '\xFF\xD8\xFF'];
  const hasBinaryIndicator = binaryIndicators.some(indicator => 
    content.substring(0, 100).includes(indicator)
  );
  
  if (hasBinaryIndicator) {
    return false;
  }
  
  // Check printable character ratio
  const printableChars = content.replace(/[^\x20-\x7E\s]/g, '').length;
  const totalChars = content.length;
  const printableRatio = printableChars / totalChars;
  
  return printableRatio >= 0.7;
}

function extractTextFromHtml(htmlContent) {
  // Remove script and style tags
  let text = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// ========================================
// PHASE 2: MEETING PROCESSING
// ========================================
function processMeeting(meeting) {
  // Step 1: Load OKR context
  const okrContext = loadOkrContext();
  
  // Step 2: Add meeting context to transcript (title and date)
  const transcriptWithContext = addMeetingContextToTranscript(meeting);
  
  // Step 3: Generate AI summaries with contextualized transcript
  const detailedSummary = generateDetailedSummary(transcriptWithContext, okrContext);
  const conciseSummary = generateConciseSummary(transcriptWithContext);
  
  // Step 4: Update documents
  updateWeeklySummary(meeting, conciseSummary);
  updateTranscriptArchive(meeting);
  
  // Step 5: Send email to participants
  sendSummaryEmail(meeting, detailedSummary);
}

function loadOkrContext() {
  try {
    const doc = DocumentApp.openById(CONFIG.okrDocumentId);
    const content = doc.getBody().getText();
    Logger.log(`✓ Loaded OKR context (${content.length} characters)`);
    return content;
  } catch (error) {
    Logger.log(`⚠ Could not load OKR context: ${error.message}`);
    return 'OKR context not available';
  }
}

function addMeetingContextToTranscript(meeting) {
  const dateStr = Utilities.formatDate(meeting.startTime, Session.getScriptTimeZone(), 'EEEE, MMMM dd, yyyy hh:mm a');
  const header = `Meeting: ${meeting.title}\nDate: ${dateStr}\n\n${'='.repeat(80)}\n\n`;
  
  // Truncate transcript if it exceeds max input characters
  const maxChars = CONFIG.geminiMaxInputChars || 100000;
  let transcript = meeting.transcript;
  if (transcript.length > maxChars) {
    Logger.log(`Transcript too long (${transcript.length} chars), truncating to ${maxChars} chars`);
    transcript = transcript.substring(0, maxChars) + '\n\n[TRANSCRIPT TRUNCATED]';
  }
  
  return header + transcript;
}

function callGeminiAPI(prompt) {
  const apiKey = CONFIG.geminiApiKey;
  const model = CONFIG.geminiModel || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: CONFIG.geminiMaxOutputTokens || 8192,
    }
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid API response structure');
    }
  } catch (error) {
    Logger.log(`Gemini API error: ${error.message}`);
    throw error;
  }
}

function generateDetailedSummary(transcript, okrContext) {
  const prompt = 
    'You are an executive assistant analyzing a team meeting transcript. Generate a comprehensive HTML summary that includes:\n\n' +
    '<h2>Executive Overview</h2>\n' +
    '<p>[2-3 sentence overview of the meeting\'s main purpose and outcomes]</p>\n\n' +
    '<h2>Key Decisions Made</h2>\n' +
    '<ul>\n' +
    '<li>[List all major decisions with context]</li>\n' +
    '</ul>\n\n' +
    '<h2>Action Items</h2>\n' +
    '<ul>\n' +
    '<li>[List all action items with owners and deadlines]</li>\n' +
    '</ul>\n\n' +
    '<h2>Discussion Highlights</h2>\n' +
    '<ul>\n' +
    '<li>[Key discussion points and insights]</li>\n' +
    '</ul>\n\n' +
    'IMPORTANT: Reduce duplications, Provide ONLY the HTML content without any markdown formatting, code blocks, or ```html markers. The output should be clean HTML that can be directly embedded in an email.\n\n' +
    'Meeting Transcript:\n' + transcript + '\n\n' +
    'OKR Context:\n' + okrContext;
  
  return callGeminiAPI(prompt);
}

function generateConciseSummary(transcript) {
  const prompt = 
    'Generate a concise summary of this meeting transcript, with highlight, low lights, main outcomes and decisions sections.\n\n' +
    'Format the response EXACTLY like this:\n\n' +
    '**Highlights:**\n' +
    '* First highlight point\n' +
    '* Second highlight point\n\n' +
    '**Low Lights:**\n' +
    '* First challenge or issue\n' +
    '* Second challenge or issue\n\n' +
    '**Main Outcomes:**\n' +
    '* First main outcome\n' +
    '* Second main outcome\n\n' +
    '**Decisions:**\n' +
    '* First decision or action item\n' +
    '* Second decision or action item\n\n' +
    'IMPORTANT RULES:\n' +
    '1. Use **bold** for section headers (Highlights, Low Lights, Main Outcomes, Decisions)\n' +
    '2. Use * (asterisk followed by space) for bullet points\n' +
    '3. Do NOT use any other markdown formatting\n' +
    '4. Keep each bullet point concise (1-2 sentences max)\n' +
    '5. Focus on the most important points from the meeting\n\n' +
    'Meeting Transcript:\n' + transcript;
  
  return callGeminiAPI(prompt);
}

function updateWeeklySummary(meeting, conciseSummary) {
  const doc = DocumentApp.openById(CONFIG.weeklySummaryDocId);
  const body = doc.getBody();
  
  const sectionHeader = 'POD Meetings';
  const bodyText = body.getText();
  const headerIndex = bodyText.indexOf(sectionHeader);
  
  const dateStr = Utilities.formatDate(meeting.startTime, Session.getScriptTimeZone(), 'MMM dd, yyyy');
  
  // Find insertion point
  let insertIndex = body.getNumChildren(); // Default to end
  
  if (headerIndex === -1) {
    // Create new POD Meetings section at the end
    const sectionPara = body.appendParagraph(sectionHeader);
    sectionPara.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    insertIndex = body.getNumChildren();
  } else {
    // Find the end of the POD Meetings section
    const sectionEnd = bodyText.indexOf('##', headerIndex + sectionHeader.length);
    if (sectionEnd !== -1) {
      // Find the paragraph that contains the next section header
      const numChildren = body.getNumChildren();
      
      for (let i = 0; i < numChildren; i++) {
        const child = body.getChild(i);
        if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
          const paragraphText = child.asParagraph().getText();
          if (paragraphText.includes('##') && paragraphText !== sectionHeader) {
            insertIndex = i;
            break;
          }
        }
      }
    }
  }
  
  // Add meeting header with proper formatting
  const meetingHeaderPara = body.insertParagraph(insertIndex, `${meeting.title} - ${dateStr}`);
  meetingHeaderPara.setHeading(DocumentApp.ParagraphHeading.HEADING3);
  insertIndex++;
  
  // Parse and format the concise summary with proper Google Docs formatting
  formatConciseSummary(body, conciseSummary, insertIndex);
}

function formatConciseSummary(body, conciseSummary, startIndex) {
  const lines = conciseSummary.split('\n');
  let currentIndex = startIndex;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') {
      // Skip empty lines
      continue;
    }
    
    // Check for section headers (Highlights, Low Lights, etc.)
    if (line.match(/^\*\*(.*?)\*\*:?$/)) {
      const sectionTitle = line.replace(/^\*\*(.*?)\*\*:?$/, '$1');
      const headerPara = body.insertParagraph(currentIndex, sectionTitle);
      headerPara.setHeading(DocumentApp.ParagraphHeading.HEADING4);
      headerPara.setBold(true);
      currentIndex++;
    }
    // Check for bullet points - handle both "* text" and "*text" patterns
    else if (line.match(/^\*\s*(.*)$/)) {
      const bulletText = line.replace(/^\*\s*/, '');
      const bulletPara = body.insertParagraph(currentIndex, `• ${bulletText}`);
      currentIndex++;
    }
    // Check for numbered lists - use simple numbering
    else if (line.match(/^\d+\.\s*(.*)$/)) {
      const numberedText = line.replace(/^\d+\.\s*/, '');
      const numberedPara = body.insertParagraph(currentIndex, `• ${numberedText}`);
      currentIndex++;
    }
    // Regular paragraph
    else if (line.length > 0) {
      const para = body.insertParagraph(currentIndex, line);
      currentIndex++;
    }
  }
}

function updateTranscriptArchive(meeting) {
  const doc = DocumentApp.openById(CONFIG.transcriptArchiveDocId);
  const body = doc.getBody();
  
  const dateStr = Utilities.formatDate(meeting.startTime, Session.getScriptTimeZone(), 'EEEE, MMMM dd, yyyy hh:mm a');
  const header = `\n\n${'='.repeat(80)}\n${meeting.title} - ${dateStr}\n${'='.repeat(80)}\n\n`;
  
  body.appendParagraph(header);
  body.appendParagraph(meeting.transcript);
  body.appendHorizontalRule();
}

// ========================================
// EMAIL FUNCTIONS
// ========================================
function sendSummaryEmail(meeting, detailedSummary) {
  const dateStr = Utilities.formatDate(meeting.startTime, Session.getScriptTimeZone(), 'MMMM dd, yyyy');
  const subject = `${CONFIG.emailSubjectPrefix} ${meeting.title} - ${dateStr}`;
  
  // Determine recipients based on configuration
  let recipients;
  if (CONFIG.emailAllParticipants) {
    recipients = meeting.attendees.filter(email => email !== CONFIG.podLeaderEmail);
  } else {
    recipients = [CONFIG.podLeaderEmail];
  }
  
  if (recipients.length === 0) {
    Logger.log('No recipients configured for email');
    return;
  }
  
  const recipientList = recipients.join(', ');
  
  // Clean the detailed summary to remove any markdown formatting
  const cleanSummary = detailedSummary
    .replace(/```html\s*/g, '')  // Remove ```html markers
    .replace(/```\s*/g, '')      // Remove any remaining ``` markers
    .replace(/^\s*<html[^>]*>/i, '')  // Remove opening html tags
    .replace(/<\/html>\s*$/i, '')     // Remove closing html tags
    .replace(/^\s*<body[^>]*>/i, '')  // Remove opening body tags
    .replace(/<\/body>\s*$/i, '')     // Remove closing body tags
    .trim();
  
  // Create HTML email body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
    h1 { color: #2c3e50; margin: 0 0 10px 0; }
    h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-top: 25px; }
    .header { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #3498db; margin-bottom: 20px; border-radius: 4px; }
    .content { background-color: #fff; padding: 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${meeting.title}</h1>
    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${dateStr}</p>
  </div>
  
  <div class="content">
    ${cleanSummary}
  </div>
  
  <div class="footer">
    <p>This summary was automatically generated by the Pod Leader Automation system.</p>
    <p>Questions? Contact ${CONFIG.podLeaderEmail}</p>
  </div>
</body>
</html>
`;
  
  // Create plain text version
  const plainBody = `
${meeting.title} - ${dateStr}

${cleanSummary.replace(/<[^>]*>/g, '')}

This summary was automatically generated by the Pod Leader Automation system.
Questions? Contact ${CONFIG.podLeaderEmail}
`;
  
  try {
    MailApp.sendEmail({
      to: recipientList,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });
    
    Logger.log(`✓ Email sent to: ${recipientList}`);
  } catch (error) {
    Logger.log(`✗ Failed to send email: ${error.message}`);
    throw error;
  }
}

function sendErrorNotification(subject, message) {
  const body = `
An error occurred in the Pod Leader Automation system:

${subject}

Error Details:
${message}

Time: ${new Date()}

Please check the Apps Script logs for more details.
`;
  
  try {
    MailApp.sendEmail(CONFIG.podLeaderEmail, subject, body);
  } catch (e) {
    Logger.log(`Could not send error notification: ${e.message}`);
  }
}

// ========================================
// TRIGGER SETUP
// ========================================
function setupDailyTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runDailyPodAutomation') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger (runs at 8 AM)
  ScriptApp.newTrigger('runDailyPodAutomation')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();
  
  Logger.log('✓ Daily trigger set up successfully');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function clearProcessedMeetings() {
  const properties = PropertiesService.getScriptProperties();
  const key = CONFIG.processedMeetingsKey || 'PROCESSED_MEETINGS';
  properties.deleteProperty(key);
  Logger.log('✓ Cleared all processed meetings history');
  Logger.log('All meetings will be eligible for reprocessing on next run');
}

// ========================================
// END OF MAIN AUTOMATION CODE
// ========================================
// All debug and testing functions have been moved to debug.js
// for better code organization and maintainability.
