# Feature Specification: Telegram Video Curation Bot

**Feature Branch**: `001-telegram-video-curation`  
**Created**: 2025-01-20  
**Status**: Draft  
**Input**: User description: "Create curated video from telegram. User sends a message to telegram age-range group (0-2, 3-5yrs etc) and once the message it arrived, telegram api should send the message to external api"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share Video Link with Category (Priority: P1)

A content curator sends a YouTube video link to an age-range Telegram group (e.g., "3-5 years"). The bot detects the message, presents category options via inline buttons, and the curator selects the appropriate category. The bot then sends the video information with metadata to the content management system for review and publication.

**Why this priority**: This is the core workflow that enables the entire curation process. Without this, no videos can be added to the system.

**Independent Test**: Can be fully tested by sending a YouTube link to the Telegram group, selecting a category from the inline buttons, and verifying the data appears in the content management system with correct metadata (video URL, category, age range, status).

**Acceptance Scenarios**:

1. **Given** a curator is in the "3-5 years" Telegram group, **When** they post a YouTube video link, **Then** the bot responds with inline category buttons (Education, Entertainment, Music, Science, Arts & Crafts, Sports, Nature, Stories)
2. **Given** the bot has presented category buttons, **When** the curator taps "Education", **Then** the bot sends the video data to the content management system with fields: title (extracted from YouTube), youtubeUrl, youtubeId, category="Education", ageRange="3-5", status="pending", and confirms submission to the curator
3. **Given** a video link was successfully categorized, **When** checking the content management system, **Then** a new video entry exists with all correct metadata

---

### User Story 2 - Handle Multiple Curators Simultaneously (Priority: P2)

Multiple content curators share different video links in the same age-range group at the same time. The bot correctly tracks which category selection belongs to which original video message, ensuring no mix-ups between different curator submissions.

**Why this priority**: Supports team collaboration and prevents data corruption when multiple curators work simultaneously.

**Independent Test**: Can be tested by having two users post different video links within seconds of each other, each selecting different categories, and verifying both submissions arrive in the content management system with correct pairings.

**Acceptance Scenarios**:

1. **Given** Curator A posts Video X and Curator B posts Video Y within 5 seconds, **When** both receive category buttons, **Then** each curator sees category options for their respective video
2. **Given** both curators have pending category selections, **When** Curator A selects "Music" and Curator B selects "Science", **Then** Video X is saved with category "Music" and Video Y with category "Science" (no cross-contamination)
3. **Given** concurrent submissions, **When** checking message correlation, **Then** each callback query is correctly mapped to its original message using unique message identifiers

---

### User Story 3 - Cross-Age-Range Curation (Priority: P2)

A curator operates across multiple age-range groups (0-2, 3-5, 6-8, 9-12, 13+). When they share videos in different groups, the bot automatically applies the correct age range metadata based on which group received the message.

**Why this priority**: Ensures metadata accuracy and reduces manual errors when curators manage content across different age demographics.

**Independent Test**: Can be tested by posting the same video link to different age-range groups, selecting categories in each, and verifying each submission has the correct age range in the content management system.

**Acceptance Scenarios**:

1. **Given** a curator posts a video in the "0-2 years" group, **When** they select "Nature" category, **Then** the video is saved with the corresponding age range for that group
2. **Given** the same curator posts a different video in the "9-12 years" group, **When** they select "Science" category, **Then** the video is saved with the corresponding age range for that group
3. **Given** videos submitted to different age groups, **When** reviewing content management system entries, **Then** each video has the correct age range matching its source group

---

### User Story 4 - Handle Invalid or Missing Video Links (Priority: P3)

When a curator sends a message that doesn't contain a valid YouTube link, the bot provides helpful feedback without attempting to process it as a video submission.

**Why this priority**: Improves user experience and prevents invalid data from reaching the CMS, but is lower priority than core functionality.

**Independent Test**: Can be tested by sending text-only messages, invalid URLs, and non-YouTube links, verifying the bot responds appropriately without creating content management system entries.

**Acceptance Scenarios**:

1. **Given** a curator posts "This is a great video!" without a link, **When** the bot analyzes the message, **Then** the bot does not present category buttons
2. **Given** a curator posts a link to Vimeo or another platform, **When** the bot detects non-YouTube URL, **Then** the bot responds with "Please share YouTube links only" and does not present category buttons
3. **Given** an invalid YouTube URL format, **When** the bot attempts to extract video ID, **Then** the bot notifies the curator "Invalid YouTube link format" without creating a content management system entry

---

### Edge Cases

- **What happens when the curator doesn't select a category?** The bot should wait for selection without timeout, or after a reasonable period (e.g., 24 hours), mark the submission as expired and allow re-submission
- **What happens when the bot loses connection to the content management system?** The bot should retry the submission up to 3 times with exponential backoff, then notify the curator of the failure with instructions to try again
- **What happens when the same video link is shared multiple times?** The bot should process each submission independently, allowing the content management system to handle duplicate detection based on youtubeId
- **What happens when a curator edits or deletes their original message after selecting a category?** The bot should still complete the submission using the cached original message content, as the category selection has already been made
- **What happens when the YouTube video is private, deleted, or region-restricted?** The bot should attempt to extract metadata but may submit with limited information; content management system validation can catch these cases during review
- **What happens when the group ID doesn't match a known age range?** The bot should use a default age range (e.g., "uncategorized") or prompt admin to configure the group mapping

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Bot MUST detect messages containing YouTube video links in configured age-range Telegram groups
- **FR-002**: Bot MUST extract YouTube video ID from shared links in various URL formats (youtube.com/watch?v=, youtu.be/, youtube.com/embed/, etc.)
- **FR-003**: Bot MUST respond to valid video links with inline keyboard buttons displaying all 8 category options: Education, Entertainment, Music, Science, Arts & Crafts, Sports, Nature, Stories
- **FR-004**: Bot MUST correlate category selections to the original video message using unique message and user identifiers
- **FR-005**: Bot MUST determine the age range based on which Telegram group received the message, mapping to one of: 0-2, 3-5, 6-8, 9-12, 13+
- **FR-006**: Bot MUST extract video metadata from YouTube (minimally: video title for the title field)
- **FR-007**: Bot MUST send structured data to the content management system containing: title, youtubeUrl, youtubeId, category (from selection), ageRange (from group), status (default: "pending"), tags (empty array initially)
- **FR-008**: Bot MUST confirm successful submission to the curator with a message indicating the video was saved
- **FR-009**: Bot MUST handle concurrent submissions from multiple users without mixing up message-category associations
- **FR-010**: Bot MUST be configured to detect all messages posted in the group (not just those directed at the bot)
- **FR-011**: Bot MUST ignore messages that don't contain YouTube links (no category buttons presented)
- **FR-012**: Bot MUST validate YouTube URL format before presenting category options
- **FR-013**: System MUST retry failed content management system submissions up to 3 times with exponential backoff
- **FR-014**: Bot MUST notify curator if submission to content management system fails after all retries
- **FR-015**: Bot MUST maintain a mapping of group identifiers to age ranges for automatic age-range detection

### Key Entities

- **Video Submission**: Represents a curated video entry with attributes: title (extracted from video platform), youtubeUrl (full URL shared by curator), youtubeId (extracted identifier), category (selected by curator from 8 options: Education, Entertainment, Music, Science, Arts & Crafts, Sports, Nature, Stories), ageRange (determined by source group: 0-2, 3-5, 6-8, 9-12, 13+), status (default: pending review), tags (initially empty for future enhancement)
- **Category Selection**: Represents the user's choice from inline keyboard, containing: selected category name, original message reference, user who selected, timestamp of selection
- **Age Range Group**: Represents a group configuration with attributes: group identifier, age_range (one of the 5 age brackets), group_name (descriptive name for admin reference)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Curators can share a video link and complete category selection in under 30 seconds
- **SC-002**: 100% of video submissions correctly map to their selected categories (no mix-ups between concurrent submissions)
- **SC-003**: 100% of video submissions include the correct age range matching the source Telegram group
- **SC-004**: Bot responds to video links with category buttons within 2 seconds of message detection
- **SC-005**: System successfully delivers 95% of submissions to CMS on first attempt, 99% after retries
- **SC-006**: Zero category selections are lost or misassigned when handling up to 10 concurrent submissions
- **SC-007**: Bot correctly ignores 100% of non-video messages without presenting category buttons
- **SC-008**: Curators receive confirmation of successful submission within 5 seconds of category selection
- **SC-009**: All submitted videos appear in content management system with complete metadata (all required fields populated)
- **SC-010**: System operates across all 5 age-range groups without manual intervention or configuration per submission
