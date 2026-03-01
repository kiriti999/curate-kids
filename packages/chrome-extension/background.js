// Background service worker for CurateKids YouTube Blocker

const RULESET_ID = 'youtube_rules';

// Initialize extension state on install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('[CurateKids] Safe Browsing installed');

    // Enable blocking by default
    await chrome.storage.local.set({ blockingEnabled: true });

    // Ensure ruleset is enabled
    await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [RULESET_ID]
    });
});

// Listen for messages from web pages (for future CurateKids app integration)
chrome.runtime.onMessageExternal.addListener(
    async (request, sender, sendResponse) => {
        if (request.action === 'getStatus') {
            const rulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
            const enabled = rulesets.includes(RULESET_ID);
            sendResponse({ blocked: enabled });
        } else if (request.action === 'enable') {
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                enableRulesetIds: [RULESET_ID]
            });
            await chrome.storage.local.set({ blockingEnabled: true });
            sendResponse({ success: true, blocked: true });
        } else if (request.action === 'disable') {
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                disableRulesetIds: [RULESET_ID]
            });
            await chrome.storage.local.set({ blockingEnabled: false });
            sendResponse({ success: true, blocked: false });
        }
        return true; // Keep message channel open for async response
    }
);
