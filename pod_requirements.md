# Project Requirements: Pod Leader Automation

## 1. Goal

To create an automated system that runs daily to find and process transcripts from recent, specified team meetings. The system will use AI to analyze these transcripts, generate relevant summaries, update central knowledge documents, and distribute the findings to all meeting participants, thereby saving the pod leader significant administrative time.

## 2. Conceptual Inputs & Configuration

The system requires the following pieces of information to function correctly:

* **Meeting Identifiers:** A list of titles for the recurring meetings that should be monitored (e.g., "Pod Weekly Sync", "RHELBU Standup"). Must match calendar event titles exactly.

* **Processing Timeframe:** A defined look-back period (e.g., the last 15 days) to search for relevant meetings, with configurable transcript search window.

* **Contextual Knowledge Source:** A document containing the team's Objectives and Key Results (OKRs) to provide context for AI analysis and generate OKR Impact sections.

* **Central Knowledge Repositories:**
  * A primary document for the **Weekly Summary Report** with native Google Docs formatting.
  * A master document to serve as a cumulative **Transcript Archive** with proper headers.

* **Communication & Identification:**
  * The email address of the pod leader (or a primary contact list).
  * The specific name of the pod to identify its section within the Weekly Summary Report.
  * Email distribution preference (all participants or pod leader only).
  * HTML email formatting with professional styling.

* **AI Configuration:**
  * Access credentials for the Generative AI model (Gemini API).
  * Model selection (gemini-2.5-flash, gemini-1.5-pro, etc.).
  * Token limits for input and output optimization.
  * Enhanced prompts for consistent formatting and OKR analysis.

* **Performance Optimization:**
  * Transcript search date range configuration.
  * Meet Recordings folder specification for faster searches.
  * Early termination settings for close matches.
  * File processing limits to prevent excessive processing.

## 3. Core Processing Logic (Daily Cycle)

The automation follows a logical sequence of steps once per day.

### Phase 1: Discovery & Filtering

1. **Identify Potential Meetings:** The system queries the calendar for all events within the configured timeframe that match any of the specified meeting identifiers.

2. **Filter for New Meetings:** The system maintains a persistent record of all meetings it has already processed. It compares the list of potential meetings against this record and proceeds only with those that are new.

### Phase 2: Processing Each New Meeting

For each new, unprocessed meeting, the system executes the following logic loop:

1. **Data Extraction:**
   * It locates and retrieves the full text from the meeting transcript using optimized search methods:
     * **Primary**: Google Meet "Notes by Gemini" documents with exact pattern matching
     * **Fallback**: Drive API v3 export methods for document access
     * **Alternative**: DocumentApp access with multiple retry methods
     * **Smart filtering**: Date range filtering and early termination for performance
   * It retrieves the list of all invited participants' email addresses from the same event.
   * **Performance optimization**: Processes up to 500 files maximum with intelligent date filtering.

2. **AI-Powered Analysis & Synthesis:**
   * **Task 1 (Detailed Summary):** The system sends the meeting transcript *and* the OKR context document to the AI model. It prompts the model to produce a detailed, structured summary in HTML format that includes:
     * Executive overview with key insights
     * Key decisions and action items
     * **OKR Impact analysis** showing how discussions align with specific objectives
     * Professional HTML formatting for email distribution
   * **Task 2 (Concise Update):** The system sends just the meeting transcript to the AI model with enhanced prompts to synthesize the most critical outcomes into structured sections:
     * Highlights, Low Lights, Main Outcomes, Decisions
     * **OKR Impact** analysis for strategic context
     * Native Google Docs formatting with proper headings and bullet points

3. **Information Archiving & Aggregation:**
   * **Update Weekly Report:** The system accesses the Weekly Summary Report, finds the section corresponding to the pod's name, and appends the structured summary with:
     * Native Google Docs formatting (H3 headings, bold H4 section headers, bullet points)
     * Professional layout with proper spacing and structure
     * OKR Impact analysis for strategic context
   * **Update Master Archive:** The system accesses the Master Transcript Archive and appends the full, original transcript from the meeting, prefixed with a clear header containing the meeting's title and date.

4. **Communication & Distribution:**
   * The system constructs an email containing the detailed, structured summary from Task 1 with:
     * Professional HTML formatting with CSS styling
     * Clean content without markdown artifacts
     * OKR Impact analysis for strategic context
     * Responsive design for various email clients
   * By default, this email is sent only to the pod leader for review.
   * Optionally, it can be configured to send to all meeting participants and the designated pod leader simultaneously.

5. **State Management:**
   * Upon successful completion of all steps for a meeting, the system adds that meeting's unique identifier to its persistent record of processed events. This is a critical step to ensure the meeting is not processed again in future runs.

## 4. System Outputs

Each successful run of the logic for a new meeting produces three distinct outputs:

1. **An Email:** Sent to meeting attendees (or pod leader only), containing:
   * Professional HTML formatting with CSS styling
   * Detailed summary with executive overview
   * Key decisions and action items
   * **OKR Impact analysis** showing strategic alignment
   * Clean content without formatting artifacts

2. **An Updated Weekly Summary Document:** With a new entry reflecting the latest meeting's progress:
   * Native Google Docs formatting (H3 headings, bold H4 section headers)
   * Structured sections: Highlights, Low Lights, Main Outcomes, Decisions
   * **OKR Impact** analysis for strategic context
   * Professional bullet points and clean layout

3. **An Updated Master Transcript Archive:** With the latest meeting's full conversation added to the historical record with proper headers and formatting.

---

## Implementation Notes

* The system is designed to run once daily at a configured time with performance optimizations.
* All processing is idempotent - meetings are never processed twice.
* **Enhanced error handling** with multiple fallback methods and comprehensive logging.
* The system gracefully handles missing transcripts by skipping those meetings.
* **Performance optimizations** include date filtering, early termination, and file processing limits.
* **Native Google Docs formatting** ensures professional document appearance.
* **OKR Impact analysis** provides strategic context for all meeting outcomes.
* **Multiple document access methods** ensure reliable transcript extraction.
* **Professional email formatting** with HTML and CSS for better presentation.
* All operations are logged for monitoring and debugging purposes with detailed error reporting.