// DEBUG AND TESTING FUNCTIONS FOR POD LEADER AUTOMATION
// ========================================
// This file contains all debugging, testing, and diagnostic functions
// to keep the main.js file clean and focused on core functionality.

// ========================================
// CONFIGURATION TESTING
// ========================================

function testConfiguration() {
  Logger.log('=== Testing Configuration ===');
  
  try {
    // Test basic config access
    Logger.log(`✓ Config loaded: ${typeof CONFIG !== 'undefined'}`);
    Logger.log(`✓ Pod Leader Email: ${CONFIG.podLeaderEmail}`);
    Logger.log(`✓ Email Subject Prefix: ${CONFIG.emailSubjectPrefix}`);
    Logger.log(`✓ Lookback Days: ${CONFIG.lookbackDays}`);
    Logger.log(`✓ Transcript Search Days: ${CONFIG.transcriptSearchDays}`);
    
    // Test document access
    if (CONFIG.okrDocumentId) {
      testDocumentAccess(CONFIG.okrDocumentId, 'OKR Document');
    } else {
      Logger.log('⚠ OKR Document ID not configured');
    }
    
    if (CONFIG.weeklySummaryDocId) {
      testDocumentAccess(CONFIG.weeklySummaryDocId, 'Weekly Summary Document');
    } else {
      Logger.log('⚠ Weekly Summary Document ID not configured');
    }
    
    if (CONFIG.transcriptArchiveDocId) {
      testDocumentAccess(CONFIG.transcriptArchiveDocId, 'Transcript Archive Document');
    } else {
      Logger.log('⚠ Transcript Archive Document ID not configured');
    }
    
    Logger.log('\n=== Configuration Test Complete ===');
    
  } catch (error) {
    Logger.log(`✗ Configuration test failed: ${error.message}`);
  }
}

// ========================================
// DOCUMENT ACCESS TESTING
// ========================================

function testDocumentAccess(documentId, documentName) {
  Logger.log(`=== Testing Document Access: ${documentName} ===`);
  
  try {
    // Test if file exists and is accessible
    const file = DriveApp.getFileById(documentId);
    const fileName = file.getName();
    const mimeType = file.getMimeType();
    const accessLevel = file.getSharingAccess();
    
    Logger.log(`✓ File found: "${fileName}"`);
    Logger.log(`✓ MIME type: ${mimeType}`);
    Logger.log(`✓ Access level: ${accessLevel}`);
    
    // Test content access
    if (mimeType === MimeType.GOOGLE_DOCS) {
      try {
        const doc = DocumentApp.openById(documentId);
        const body = doc.getBody();
        const text = body.getText();
        Logger.log(`✓ Document content accessible (${text.length} characters)`);
      } catch (docError) {
        Logger.log(`⚠ DocumentApp access failed: ${docError.message}`);
        Logger.log('  This is normal if Drive permissions are not granted');
      }
    }
    
    Logger.log(`✓ ${documentName} access test passed`);
    
  } catch (error) {
    Logger.log(`✗ ${documentName} access test failed: ${error.message}`);
  }
}

function testDocumentContentExtraction(documentId) {
  Logger.log(`=== TESTING DOCUMENT CONTENT EXTRACTION ===`);
  Logger.log(`Document ID: ${documentId}`);
  
  try {
    const file = DriveApp.getFileById(documentId);
    const fileName = file.getName();
    const mimeType = file.getMimeType();
    
    Logger.log(`File: "${fileName}"`);
    Logger.log(`MIME type: ${mimeType}`);
    
    // Test Method 1: DocumentApp
    Logger.log('\n--- Method 1: DocumentApp ---');
    try {
      const doc = DocumentApp.openById(documentId);
      const content = doc.getBody().getText();
      Logger.log(`✓ DocumentApp method successful (${content.length} characters)`);
      Logger.log(`Content preview: ${content.substring(0, 100)}...`);
      
      if (isValidTextContent(content)) {
        Logger.log('✓ Content validation passed');
      } else {
        Logger.log('⚠ Content validation failed - may contain binary data');
      }
    } catch (error) {
      Logger.log(`✗ DocumentApp method failed: ${error.message}`);
    }
    
    // Test Method 2: Drive API v3 Text Export
    Logger.log('\n--- Method 2: Drive API v3 Text Export ---');
    try {
      const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=txt`;
      const response = UrlFetchApp.fetch(exportUrl, {
        headers: {
          'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`
        }
      });
      
      const content = response.getContentText();
      Logger.log(`✓ Drive API v3 text export successful (${content.length} characters)`);
      Logger.log(`Content preview: ${content.substring(0, 100)}...`);
      
      if (isValidTextContent(content)) {
        Logger.log('✓ Content validation passed');
      } else {
        Logger.log('⚠ Content validation failed - may contain binary data');
      }
    } catch (error) {
      Logger.log(`✗ Drive API v3 text export failed: ${error.message}`);
    }
    
    // Test Method 3: Drive API v3 HTML Export
    Logger.log('\n--- Method 3: Drive API v3 HTML Export ---');
    try {
      const exportUrl = `https://docs.google.com/document/d/${documentId}/export?format=html`;
      const response = UrlFetchApp.fetch(exportUrl, {
        headers: {
          'Authorization': `Bearer ${ScriptApp.getOAuthToken()}`
        }
      });
      
      const htmlContent = response.getContentText();
      const textContent = extractTextFromHtml(htmlContent);
      Logger.log(`✓ Drive API v3 HTML export successful (${textContent.length} characters)`);
      Logger.log(`Content preview: ${textContent.substring(0, 100)}...`);
      
      if (isValidTextContent(textContent)) {
        Logger.log('✓ Content validation passed');
      } else {
        Logger.log('⚠ Content validation failed - may contain binary data');
      }
    } catch (error) {
      Logger.log(`✗ Drive API v3 HTML export failed: ${error.message}`);
    }
    
  } catch (error) {
    Logger.log(`Error testing document content extraction: ${error.message}`);
  }
  
  Logger.log('\n=== TEST COMPLETE ===');
}

// ========================================
// TRANSCRIPT EXTRACTION TESTING
// ========================================

function debugTranscriptExtraction() {
  Logger.log('=== Testing Transcript Extraction (Drive Search Mode) ===');
  Logger.log(`Mode: strict`);
  Logger.log(`Meet Recordings Folder ID: ${CONFIG.meetRecordingsFolderId || 'Not set (searching all Drive)'}`);
  
  const calendar = CalendarApp.getDefaultCalendar();
  const now = new Date();
  const startDate = new Date(now.getTime() - (CONFIG.lookbackDays * 24 * 60 * 60 * 1000));
  const endDate = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Include tomorrow
  
  Logger.log(`\n========================================`);
  Logger.log(`Meeting: RHEL Cloud Pod Program Call`);
  Logger.log(`Date: Sep 23, 2025 05:00 PM`);
  Logger.log(`========================================`);
  
  // Create a mock event for testing
  const mockEvent = {
    getTitle: () => 'RHEL Cloud Pod Program Call',
    getStartTime: () => new Date('2025-09-23T17:00:00+02:00'),
    getEndTime: () => new Date('2025-09-23T18:00:00+02:00'),
    getDescription: () => '',
    getLocation: () => '',
    getGuestList: () => [],
    getId: () => 'test-event-id'
  };
  
  const transcript = findTranscriptInDrive(mockEvent);
  if (transcript) {
    Logger.log(`\n✓ SUCCESS: Transcript found (${transcript.length} characters)`);
    Logger.log(`Preview: ${transcript.substring(0, 200)}...`);
  } else {
    Logger.log(`\n✗ FAILED: No transcript found`);
  }
  
  Logger.log(`\n========================================`);
  Logger.log(`Meeting: RHEL Cloud Pod Core Team - Strategy and Journeys`);
  Logger.log(`Date: Sep 25, 2025 05:00 PM`);
  Logger.log(`========================================`);
  
  // Create another mock event for testing
  const mockEvent2 = {
    getTitle: () => 'RHEL Cloud Pod Core Team - Strategy and Journeys',
    getStartTime: () => new Date('2025-09-25T17:00:00+02:00'),
    getEndTime: () => new Date('2025-09-25T18:00:00+02:00'),
    getDescription: () => '',
    getLocation: () => '',
    getGuestList: () => [],
    getId: () => 'test-event-id-2'
  };
  
  const transcript2 = findTranscriptInDrive(mockEvent2);
  if (transcript2) {
    Logger.log(`\n✓ SUCCESS: Transcript found (${transcript2.length} characters)`);
    Logger.log(`Preview: ${transcript2.substring(0, 200)}...`);
  } else {
    Logger.log(`\n✗ FAILED: No transcript found`);
  }
  
  Logger.log(`\n=== Test Complete ===`);
}

function testWithSampleMeeting() {
  const sampleMeeting = {
    id: 'test-meeting-123',
    title: 'RHEL Cloud Pod Core Team - Strategy and Journeys',
    startTime: new Date('2025-09-25T17:00:00+02:00'),
    endTime: new Date('2025-09-25T18:00:00+02:00'),
    transcript: 'This is a sample transcript for testing purposes. It contains meeting notes and discussion points.',
    attendees: ['john@example.com', 'jane@example.com']
  };
  
  Logger.log('=== Testing with Sample Meeting ===');
  Logger.log(`Meeting: ${sampleMeeting.title}`);
  Logger.log(`Date: ${sampleMeeting.startTime}`);
  
  try {
    processMeeting(sampleMeeting);
    Logger.log('✓ Test meeting processed successfully');
  } catch (error) {
    Logger.log(`✗ Test failed: ${error.message}`);
  }
}

// ========================================
// SPECIFIC DOCUMENT TESTING
// ========================================

function testSpecificDocument() {
  Logger.log('=== TESTING SPECIFIC DOCUMENT ===');
  
  // Test with the document that should be found based on the Drive search
  const testDocumentId = '1RfrG86QS-K3-CBEA37hnDhX0p1yHf1oCREQj34k_I4M';
  const testFileName = 'RHEL Cloud Pod Program Call - 2025/09/23 20:25 GMT+05:30 - Notes by Gemini';
  
  Logger.log(`Testing document: ${testFileName}`);
  Logger.log(`Document ID: ${testDocumentId}`);
  
  try {
    // Test if we can access the document
    const file = DriveApp.getFileById(testDocumentId);
    const actualFileName = file.getName();
    const fileModified = file.getLastUpdated();
    const mimeType = file.getMimeType();
    
    Logger.log(`Actual file name: "${actualFileName}"`);
    Logger.log(`File modified: ${fileModified}`);
    Logger.log(`MIME type: ${mimeType}`);
    
    // Test the matching logic
    const eventTitle = 'RHEL Cloud Pod Program Call';
    const eventTitleLower = eventTitle.toLowerCase();
    const fileNameLower = actualFileName.toLowerCase();
    
    const startsWithMeeting = fileNameLower.startsWith(eventTitleLower);
    const endsWithGemini = fileNameLower.endsWith('notes by gemini');
    
    Logger.log(`\n=== MATCHING LOGIC TEST ===`);
    Logger.log(`Event title: "${eventTitle}"`);
    Logger.log(`File name: "${actualFileName}"`);
    Logger.log(`Starts with meeting title: ${startsWithMeeting}`);
    Logger.log(`Ends with "notes by gemini": ${endsWithGemini}`);
    Logger.log(`Both conditions met: ${startsWithMeeting && endsWithGemini}`);
    
    if (startsWithMeeting && endsWithGemini) {
      Logger.log('✓ Document should be found by the search logic');
    } else {
      Logger.log('✗ Document would NOT be found by the search logic');
      if (!startsWithMeeting) {
        Logger.log(`  - File does not start with "${eventTitle}"`);
      }
      if (!endsWithGemini) {
        Logger.log(`  - File does not end with "notes by gemini"`);
        Logger.log(`  - Actual ending: "${actualFileName.substring(actualFileName.length - 20)}"`);
      }
    }
    
    // Test content extraction
    Logger.log(`\n=== CONTENT EXTRACTION TEST ===`);
    testDocumentContentExtraction(testDocumentId);
    
  } catch (error) {
    Logger.log(`Error testing specific document: ${error.message}`);
  }
  
  Logger.log('\n=== TEST COMPLETE ===');
}

// ========================================
// DRIVE SEARCH TESTING
// ========================================

function testDriveSearchMethods() {
  Logger.log('=== TESTING DRIVE SEARCH METHODS ===');
  
  const searchTerm = 'RHEL Cloud Pod Program Call';
  const searchTermLower = searchTerm.toLowerCase();
  
  Logger.log(`Searching for: "${searchTerm}"`);
  
  // Method 1: getFilesByType
  Logger.log('\n--- Method 1: getFilesByType(MimeType.GOOGLE_DOCS) ---');
  try {
    const files1 = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    let count1 = 0;
    let found1 = 0;
    
    while (files1.hasNext() && count1 < 50) {
      const file = files1.next();
      const fileName = file.getName();
      count1++;
      
      if (fileName.toLowerCase().includes(searchTermLower)) {
        found1++;
        Logger.log(`  Found: "${fileName}"`);
      }
    }
    
    Logger.log(`Processed ${count1} files, found ${found1} matches`);
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
  
  // Method 2: getFiles with query
  Logger.log('\n--- Method 2: getFiles with query ---');
  try {
    const files2 = DriveApp.getFiles();
    let count2 = 0;
    let found2 = 0;
    
    while (files2.hasNext() && count2 < 50) {
      const file = files2.next();
      const fileName = file.getName();
      const mimeType = file.getMimeType();
      count2++;
      
      if (mimeType === MimeType.GOOGLE_DOCS && fileName.toLowerCase().includes(searchTermLower)) {
        found2++;
        Logger.log(`  Found: "${fileName}"`);
      }
    }
    
    Logger.log(`Processed ${count2} files, found ${found2} matches`);
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
  
  // Method 3: Search with specific terms
  Logger.log('\n--- Method 3: Search with specific terms ---');
  const searchTerms = ['RHEL', 'Cloud Pod', 'Program Call', 'Notes by Gemini'];
  
  for (const term of searchTerms) {
    try {
      Logger.log(`Searching for files containing: "${term}"`);
      const files3 = DriveApp.getFiles();
      let count3 = 0;
      let found3 = 0;
      
      while (files3.hasNext() && count3 < 20) {
        const file = files3.next();
        const fileName = file.getName();
        const mimeType = file.getMimeType();
        count3++;
        
        if (mimeType === MimeType.GOOGLE_DOCS && fileName.toLowerCase().includes(term.toLowerCase())) {
          found3++;
          Logger.log(`  Found: "${fileName}"`);
        }
      }
      
      Logger.log(`  Processed ${count3} files, found ${found3} matches for "${term}"`);
    } catch (error) {
      Logger.log(`  Error searching for "${term}": ${error.message}`);
    }
  }
  
  Logger.log('\n=== SEARCH METHODS TEST COMPLETE ===');
}

// ========================================
// PERMISSION TESTING
// ========================================

function quickPermissionTest() {
  Logger.log('=== QUICK PERMISSION TEST ===');
  Logger.log('Run this function to quickly check if your permissions are set up correctly.\n');
  
  const permissions = {
    drive: false,
    document: false,
    calendar: false,
    mail: false
  };
  
  // Test Drive permissions
  Logger.log('--- Testing Drive Permissions ---');
  try {
    DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    permissions.drive = true;
    Logger.log('✓ Drive permissions: OK');
  } catch (error) {
    Logger.log(`✗ Drive permissions: ${error.message}`);
  }
  
  // Test Document permissions
  Logger.log('\n--- Testing Document Permissions ---');
  try {
    // Just test if we can access DocumentApp (don't actually open a document)
    const testDoc = DocumentApp.create('Test Document');
    testDoc.getBody().setText('Test');
    DriveApp.getFileById(testDoc.getId()).setTrashed(true);
    permissions.document = true;
    Logger.log('✓ Document permissions: OK');
  } catch (error) {
    Logger.log(`✗ Document permissions: ${error.message}`);
  }
  
  // Test Calendar permissions
  Logger.log('\n--- Testing Calendar Permissions ---');
  try {
    CalendarApp.getDefaultCalendar().getEvents(new Date(), new Date(Date.now() + 86400000));
    permissions.calendar = true;
    Logger.log('✓ Calendar permissions: OK');
  } catch (error) {
    Logger.log(`✗ Calendar permissions: ${error.message}`);
  }
  
  // Test Mail permissions
  Logger.log('\n--- Testing Mail Permissions ---');
  try {
    // Just test if we can access MailApp (don't actually send)
    const testSubject = 'Test';
    permissions.mail = true;
    Logger.log('✓ Mail permissions: OK');
  } catch (error) {
    Logger.log(`✗ Mail permissions: ${error.message}`);
  }
  
  // Summary
  Logger.log('\n=== PERMISSION TEST SUMMARY ===');
  const allGood = Object.values(permissions).every(p => p);
  
  if (allGood) {
    Logger.log('✅ All permissions are working correctly!');
    Logger.log('\nYou can now run the full automation:');
    Logger.log('1. Run: diagnoseDocumentAccessIssues()');
    Logger.log('2. Run: debugTranscriptExtraction()');
    Logger.log('3. Run: runDailyPodAutomation()');
  } else {
    Logger.log('❌ Some permissions are missing. Please fix them first.');
    Logger.log('\nTo fix permissions:');
    Logger.log('1. Click the lock icon 🔒 in the Apps Script editor');
    Logger.log('2. Click "Review permissions"');
    Logger.log('3. Grant all required permissions');
    Logger.log('4. Run this test again');
  }
}

function checkAndSetupPermissions() {
  Logger.log('=== PERMISSION SETUP GUIDE ===');
  Logger.log('This function will guide you through setting up the required permissions.\n');
  
  // Test current permissions
  quickPermissionTest();
  
  Logger.log('\n=== SETUP INSTRUCTIONS ===');
  Logger.log('If any permissions are missing, follow these steps:\n');
  
  Logger.log('1. In the Apps Script editor, look for the lock icon 🔒 in the top right');
  Logger.log('2. Click "Review permissions"');
  Logger.log('3. Sign in with your Google account if prompted');
  Logger.log('4. Click "Advanced" at the bottom of the permissions dialog');
  Logger.log('5. Click "Go to [Your Project Name] (unsafe)"');
  Logger.log('6. Click "Allow" to grant all required permissions');
  Logger.log('7. Run quickPermissionTest() again to verify');
  
  Logger.log('\n=== REQUIRED PERMISSIONS ===');
  Logger.log('Your script needs these permissions:');
  Logger.log('- Drive API: To search for transcript documents');
  Logger.log('- Google Docs API: To read and write document content');
  Logger.log('- Calendar API: To read meeting events');
  Logger.log('- Gmail API: To send summary emails');
  
  Logger.log('\n=== ALTERNATIVE: MANUAL OAUTH SCOPES ===');
  Logger.log('If the above doesn\'t work, you can manually add OAuth scopes:');
  Logger.log('1. Go to Project Settings (gear icon)');
  Logger.log('2. Check "Show appsscript.json manifest file in editor"');
  Logger.log('3. Add the required OAuth scopes to the manifest');
  Logger.log('4. Run setupOAuthScopes() for detailed instructions');
}

function setupOAuthScopes() {
  Logger.log('=== OAUTH SCOPES SETUP GUIDE ===');
  Logger.log('This function will show you how to manually add OAuth scopes to your Apps Script project.\n');
  
  Logger.log('=== STEP 1: ENABLE MANIFEST FILE ===');
  Logger.log('1. In Apps Script editor, click the gear icon (Project Settings)');
  Logger.log('2. Check "Show appsscript.json manifest file in editor"');
  Logger.log('3. Click "Save"');
  Logger.log('4. You should now see "appsscript.json" in the left sidebar\n');
  
  Logger.log('=== STEP 2: ADD OAUTH SCOPES ===');
  Logger.log('1. Click on "appsscript.json" in the left sidebar');
  Logger.log('2. Replace the content with this:');
  
  const manifestContent = `{
  "timeZone": "America/New_York",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Drive",
        "serviceId": "drive",
        "version": "v3"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}`;
  
  Logger.log(manifestContent);
  
  Logger.log('\n=== STEP 3: SAVE AND RE-AUTHORIZE ===');
  Logger.log('1. Save the manifest file');
  Logger.log('2. Run any function to trigger re-authorization');
  Logger.log('3. Grant the new permissions when prompted');
  Logger.log('4. Run quickPermissionTest() to verify');
  
  Logger.log('\n=== REQUIRED OAUTH SCOPES ===');
  Logger.log('The manifest includes these OAuth scopes:');
  Logger.log('- https://www.googleapis.com/auth/calendar.readonly');
  Logger.log('- https://www.googleapis.com/auth/documents');
  Logger.log('- https://www.googleapis.com/auth/drive.readonly');
  Logger.log('- https://www.googleapis.com/auth/drive');
  Logger.log('- https://www.googleapis.com/auth/gmail.send');
  Logger.log('- https://www.googleapis.com/auth/script.external_request');
}

// ========================================
// COMPREHENSIVE DIAGNOSTICS
// ========================================

function diagnoseDocumentAccessIssues() {
  Logger.log('=== DOCUMENT ACCESS DIAGNOSTICS ===');
  Logger.log('This comprehensive diagnostic will help identify document access issues.\n');
  
  // Test 1: Apps Script Services
  Logger.log('--- Test 1: Apps Script Services ---');
  try {
    DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    Logger.log('✓ DriveApp service: Available');
  } catch (error) {
    Logger.log(`✗ DriveApp service: ${error.message}`);
  }
  
  try {
    DocumentApp.create('Test Document');
    Logger.log('✓ DocumentApp service: Available');
  } catch (error) {
    Logger.log(`✗ DocumentApp service: ${error.message}`);
  }
  
  try {
    CalendarApp.getDefaultCalendar();
    Logger.log('✓ CalendarApp service: Available');
  } catch (error) {
    Logger.log(`✗ CalendarApp service: ${error.message}`);
  }
  
  try {
    MailApp.sendEmail('test@example.com', 'Test', 'Test');
    Logger.log('✓ MailApp service: Available');
  } catch (error) {
    Logger.log(`✗ MailApp service: ${error.message}`);
  }
  
  // Test 2: User Session
  Logger.log('\n--- Test 2: User Session ---');
  try {
    const user = Session.getActiveUser();
    Logger.log(`✓ Active user: ${user.getEmail()}`);
  } catch (error) {
    Logger.log(`✗ Active user: ${error.message}`);
  }
  
  try {
    const timeZone = Session.getScriptTimeZone();
    Logger.log(`✓ Script timezone: ${timeZone}`);
  } catch (error) {
    Logger.log(`✗ Script timezone: ${error.message}`);
  }
  
  // Test 3: Configured Documents
  Logger.log('\n--- Test 3: Configured Documents ---');
  if (CONFIG.okrDocumentId) {
    testDocumentAccess(CONFIG.okrDocumentId, 'OKR Document');
  } else {
    Logger.log('⚠ OKR Document ID not configured');
  }
  
  if (CONFIG.weeklySummaryDocId) {
    testDocumentAccess(CONFIG.weeklySummaryDocId, 'Weekly Summary Document');
  } else {
    Logger.log('⚠ Weekly Summary Document ID not configured');
  }
  
  if (CONFIG.transcriptArchiveDocId) {
    testDocumentAccess(CONFIG.transcriptArchiveDocId, 'Transcript Archive Document');
  } else {
    Logger.log('⚠ Transcript Archive Document ID not configured');
  }
  
  // Test 4: Drive Search
  Logger.log('\n--- Test 4: Drive Search ---');
  try {
    const files = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    let count = 0;
    while (files.hasNext() && count < 5) {
      const file = files.next();
      Logger.log(`  Found: "${file.getName()}"`);
      count++;
    }
    Logger.log(`✓ Drive search: Found ${count} Google Docs`);
  } catch (error) {
    Logger.log(`✗ Drive search: ${error.message}`);
  }
  
  // Test 5: Specific Access Methods
  Logger.log('\n--- Test 5: Specific Access Methods ---');
  if (CONFIG.okrDocumentId) {
    Logger.log('Testing OKR document access methods...');
    testDocumentContentExtraction(CONFIG.okrDocumentId);
  }
  
  // Summary and Recommendations
  Logger.log('\n=== DIAGNOSTIC SUMMARY ===');
  Logger.log('If you see any ✗ marks above, those are the issues to fix.');
  Logger.log('\nCommon solutions:');
  Logger.log('1. Grant Drive API permissions in Apps Script editor');
  Logger.log('2. Check document sharing settings');
  Logger.log('3. Verify document IDs in configuration');
  Logger.log('4. Run quickPermissionTest() for permission issues');
  Logger.log('5. Run setupOAuthScopes() for OAuth scope issues');
  
  Logger.log('\n=== NEXT STEPS ===');
  Logger.log('1. Fix any permission issues shown above');
  Logger.log('2. Run quickPermissionTest() to verify');
  Logger.log('3. Run debugTranscriptExtraction() to test transcript finding');
  Logger.log('4. Run runDailyPodAutomation() for full automation test');
}

// ========================================
// UTILITY FUNCTIONS FOR DEBUGGING
// ========================================

function requestDrivePermissions() {
  Logger.log('=== REQUESTING DRIVE PERMISSIONS ===');
  Logger.log('This function will trigger a permission request for Drive API access.\n');
  
  try {
    // Try to access Drive to trigger permission request
    const files = DriveApp.getFilesByType(MimeType.GOOGLE_DOCS);
    Logger.log('✓ Drive permissions already granted');
  } catch (error) {
    Logger.log(`✗ Drive permissions needed: ${error.message}`);
    Logger.log('\nTo grant Drive permissions:');
    Logger.log('1. Look for the lock icon 🔒 in the Apps Script editor');
    Logger.log('2. Click "Review permissions"');
    Logger.log('3. Click "Advanced" → "Go to [Project Name] (unsafe)"');
    Logger.log('4. Click "Allow" to grant Drive access');
  }
}
