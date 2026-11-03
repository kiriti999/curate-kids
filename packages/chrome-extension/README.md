# CuratedReels Safe Browsing - Chrome Extension

A Chrome extension that redirects YouTube browsing to CurateKids content (`https://curatedreels.com/content`) while allowing embedded videos to play.

## Features

- **Redirects YouTube browsing pages**: Homepage, watch pages, shorts, search results, channels → CurateKids
- **Allows embedded videos**: YouTube embeds/iframes continue to work
- **Password protection**: Set a password to prevent unauthorized disabling
- **Simple toggle**: Enable/disable redirect from the popup (password required to disable)
- **Manifest V3**: Uses modern declarativeNetRequest API

## Installation

### Developer Mode (Recommended for Testing)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `packages/chrome-extension` folder
5. The extension should appear with a green shield icon

### Set Up Password Protection

1. Click the extension icon in Chrome toolbar
2. Click **"Set/Change Password"**
3. Enter a password (min 4 characters) and confirm
4. Now the extension cannot be disabled without the password

### Verify It's Working

1. Try visiting `youtube.com` - should redirect to `curatedreels.com/content`
2. Your CurateKids app with embedded videos - embeds should work normally

## What Happens

| URL Pattern | Behavior |
|-------------|----------|
| youtube.com (homepage) | ➡️ Redirects to curatedreels.com/content |
| youtube.com/watch?v=xxx | ➡️ Redirects to curatedreels.com/content |
| youtube.com/shorts/xxx | ➡️ Redirects to curatedreels.com/content |
| youtube.com/results?search_query=xxx | ➡️ Redirects to curatedreels.com/content |
| youtube.com/@channel | ➡️ Redirects to curatedreels.com/content |
| youtube.com/feed/* | ➡️ Redirects to curatedreels.com/content |
| music.youtube.com | ➡️ Redirects to curatedreels.com/content |
| youtu.be/xxx | ➡️ Redirects to curatedreels.com/content |
| youtube.com/embed/xxx | ✅ Allowed (for embeds) |
| youtube.com/iframe_api | ✅ Allowed (for player) |
| ytimg.com/* (thumbnails) | ✅ Allowed |
| googlevideo.com/* (video streams) | ✅ Allowed |

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `rules.json` - declarativeNetRequest blocking rules
- `popup.html/js` - Toggle UI
- `background.js` - Service worker

## Development

To modify blocking rules, edit `rules.json`. Rules with higher `priority` values are evaluated first.

- Priority 10 = Allow rules (embeds, API endpoints)
- Priority 1 = Block rules (browsing pages)

After modifying rules, reload the extension in `chrome://extensions/`.
