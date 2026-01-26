/**
 * Handler constants - Centralized message strings and configuration
 */

// Error messages
export const ERROR_UPLOAD_FAILED = "❌ *Upload failed.* Please try again or share a video link instead.";
export const ERROR_SELECTION_EXPIRED = "⏰ Selection expired";
export const ERROR_SELECTION_EXPIRED_MSG = "⏰ Selection expired. Please share the video again.";
export const ERROR_SUBMISSION_FAILED = "❌ Submission failed";
export const ERROR_SUBMISSION_FAILED_MSG = "❌ Submission failed. Please try again.";
export const ERROR_INVALID_SELECTION = "❌ Invalid selection";
export const ERROR_UNAUTHORIZED = "❌ Only the original sender can select";

// Success messages
export const SUCCESS_VIDEO_SAVED = "✅ Video saved!";

// Prompt messages
export const PROMPT_SELECT_AGE_RANGE = "👶 Please select the age range for this video:";
export const PROMPT_SELECT_CATEGORY = "📁 Please select a category:";
export const PROMPT_UPLOADING = "📤 *Uploading video...*\nThis may take a moment.";
export const PROMPT_CLOUDINARY_DISABLED = "⚠️ Direct video uploads are not enabled yet. Please share a YouTube or Facebook link instead.";

// Log messages
export const LOG_AGE_RANGE_BUTTONS_SENT = "Age range buttons sent";
export const LOG_CATEGORY_BUTTONS_SENT = "Category buttons sent";
export const LOG_VIDEO_DETECTED = "Video detected";
export const LOG_VIDEO_UPLOADED = "Video file uploaded";
export const LOG_AGE_RANGE_SELECTED = "Age range selected";
export const LOG_CATEGORY_SELECTED = "Category selected";
export const LOG_VIDEO_SUBMITTED = "Video submitted";

// Age range options
export const AGE_RANGES = [
    { value: "1-2", label: "1-2 years" },
    { value: "2-3", label: "2-3 years" },
    { value: "3-4", label: "3-4 years" },
    { value: "4-5", label: "4-5 years" },
    { value: "5-8", label: "5-8 years" },
    { value: "9-12", label: "9-12 years" },
    { value: "12-15", label: "12-15 years" },
    { value: "16-18", label: "16-18 years" },
    { value: "18+", label: "18+ years" },
] as const;

// Parse mode
export const PARSE_MODE_MARKDOWN = "Markdown" as const;
