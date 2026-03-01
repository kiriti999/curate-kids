// Popup script for CurateKids YouTube Blocker with Password Protection

const RULESET_ID = 'youtube_rules';

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'curatekids_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function updateUI(enabled) {
    const statusDot = document.getElementById('statusDot');
    const statusLabel = document.getElementById('statusLabel');
    const toggle = document.getElementById('toggle');

    toggle.checked = enabled;

    if (enabled) {
        statusDot.className = 'status-dot active';
        statusLabel.className = 'status-label active';
        statusLabel.textContent = 'Active';
    } else {
        statusDot.className = 'status-dot inactive';
        statusLabel.className = 'status-label inactive';
        statusLabel.textContent = 'Disabled';
    }
}

async function getBlockingStatus() {
    const rulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    return rulesets.includes(RULESET_ID);
}

async function setBlockingEnabled(enabled) {
    if (enabled) {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: [RULESET_ID]
        });
    } else {
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: [RULESET_ID]
        });
    }
    await chrome.storage.local.set({ blockingEnabled: enabled });
}

async function hasPassword() {
    const result = await chrome.storage.local.get('passwordHash');
    return !!result.passwordHash;
}

async function verifyPassword(password) {
    const result = await chrome.storage.local.get('passwordHash');
    if (!result.passwordHash) return true; // No password set
    const hash = await hashPassword(password);
    return hash === result.passwordHash;
}

async function setPassword(password) {
    const hash = await hashPassword(password);
    await chrome.storage.local.set({ passwordHash: hash });
}

// Modal handling
let pendingAction = null;

function showPasswordModal() {
    document.getElementById('passwordModal').classList.add('show');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('passwordInput').focus();
}

function hidePasswordModal() {
    document.getElementById('passwordModal').classList.remove('show');
    pendingAction = null;
}

function showSetPasswordModal(isChange = false) {
    const modal = document.getElementById('setPasswordModal');
    const currentInput = document.getElementById('currentPasswordInput');
    const title = document.getElementById('setPasswordTitle');

    modal.classList.add('show');
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('setPasswordError').textContent = '';

    if (isChange) {
        title.textContent = 'Change Password';
        currentInput.style.display = 'block';
        currentInput.focus();
    } else {
        title.textContent = 'Set Password';
        currentInput.style.display = 'none';
        document.getElementById('newPasswordInput').focus();
    }
}

function hideSetPasswordModal() {
    document.getElementById('setPasswordModal').classList.remove('show');
}

// Initialize
let isBlockingEnabled = true;
let passwordRequired = false;

document.addEventListener('DOMContentLoaded', async () => {
    isBlockingEnabled = await getBlockingStatus();
    passwordRequired = await hasPassword();
    updateUI(isBlockingEnabled);

    const toggle = document.getElementById('toggle');
    const toggleLabel = toggle.closest('label');

    // Use mousedown on the label to intercept BEFORE click/change fires
    toggleLabel.addEventListener('mousedown', (e) => {
        // If currently enabled and password is set, clicking will try to disable - block it
        if (isBlockingEnabled && passwordRequired) {
            e.preventDefault(); // Prevent the click from happening at all
            e.stopPropagation();
            pendingAction = 'disable';
            showPasswordModal();
            return false;
        }
    });

    // Handle actual state changes (when no password or allowing enable)
    toggle.addEventListener('change', async (e) => {
        const newEnabled = e.target.checked;
        await setBlockingEnabled(newEnabled);
        isBlockingEnabled = newEnabled;
        updateUI(newEnabled);
    });

    // Password modal handlers
    document.getElementById('cancelBtn').addEventListener('click', async () => {
        hidePasswordModal();
        pendingAction = null;
        // Restore toggle to enabled state (since blocking is still on)
        document.getElementById('toggle').checked = true;
        const enabled = await getBlockingStatus();
        updateUI(enabled);
    });

    document.getElementById('submitBtn').addEventListener('click', async () => {
        const password = document.getElementById('passwordInput').value;
        const valid = await verifyPassword(password);

        if (valid) {
            const action = pendingAction; // Save before hidePasswordModal resets it
            hidePasswordModal();
            if (action === 'disable') {
                await setBlockingEnabled(false);
                isBlockingEnabled = false;
                document.getElementById('toggle').checked = false;
                updateUI(false);
            }
        } else {
            document.getElementById('passwordError').textContent = 'Incorrect password';
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordInput').focus();
        }
    });

    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('submitBtn').click();
        }
    });

    // Set/Change password button
    document.getElementById('changePasswordBtn').addEventListener('click', async () => {
        const hasPass = await hasPassword();
        showSetPasswordModal(hasPass);
    });

    // Set password modal handlers
    document.getElementById('cancelSetBtn').addEventListener('click', hideSetPasswordModal);

    document.getElementById('savePasswordBtn').addEventListener('click', async () => {
        const hasPass = await hasPassword();
        const currentPassword = document.getElementById('currentPasswordInput').value;
        const newPassword = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPasswordInput').value;
        const errorEl = document.getElementById('setPasswordError');

        // Verify current password if changing
        if (hasPass) {
            const valid = await verifyPassword(currentPassword);
            if (!valid) {
                errorEl.textContent = 'Current password is incorrect';
                return;
            }
        }

        // Validate new password
        if (newPassword.length < 4) {
            errorEl.textContent = 'Password must be at least 4 characters';
            return;
        }

        if (newPassword !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }

        await setPassword(newPassword);
        passwordRequired = true;
        hideSetPasswordModal();

        // Update button text
        document.getElementById('changePasswordBtn').textContent = '🔒 Change Password';

        alert('Password saved! You will need this password to disable the redirect.');
    });

    // Enter key handlers for set password modal
    document.getElementById('confirmPasswordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('savePasswordBtn').click();
        }
    });

    // Update button text based on password status
    if (await hasPassword()) {
        document.getElementById('changePasswordBtn').textContent = '🔒 Change Password';
    }
});
