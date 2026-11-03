#!/bin/bash
# ============================================================
# Block YouTube at DNS level (macOS)
# Blocks youtube.com while keeping youtube-nocookie.com for embeds
# Run with sudo: sudo bash block-youtube-mac.sh [enable|disable|status]
# ============================================================

HOSTS=/etc/hosts
START="# CuratedReels YouTube Block - START"
END="# CuratedReels YouTube Block - END"
DOMAINS="youtube.com www.youtube.com m.youtube.com music.youtube.com gaming.youtube.com tv.youtube.com kids.youtube.com accounts.youtube.com"
ACTION="${1:-enable}"

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ This script must be run as root"
  echo "   Run: sudo bash $0 $ACTION"
  exit 1
fi

is_blocked() { grep -qF "$START" "$HOSTS"; }

flush_dns() {
  dscacheutil -flushcache 2>/dev/null
  killall -HUP mDNSResponder 2>/dev/null
}

disable_block() {
  # Remove only our marked section, leave everything else untouched
  local tmp
  tmp="$(mktemp)"
  awk -v s="$START" -v e="$END" '
    $0 == s { skip = 1; next }
    $0 == e { skip = 0; next }
    !skip
  ' "$HOSTS" > "$tmp" && cat "$tmp" > "$HOSTS"
  rm -f "$tmp"
}

enable_block() {
  disable_block
  {
    echo ""
    echo "$START"
    echo "# Blocks YouTube browsing while allowing embedded video playback"
    echo "# via youtube-nocookie.com (privacy-enhanced mode)"
    for d in $DOMAINS; do
      echo "127.0.0.1 $d"
      echo "::1 $d"
    done
    echo "$END"
  } >> "$HOSTS"
}

case "$ACTION" in
  enable)
    enable_block
    flush_dns
    echo "✅ YouTube blocked"
    for d in $DOMAINS; do echo "  ✗ $d"; done
    echo "  ✓ www.youtube-nocookie.com (embedded videos)"
    echo "  ✓ *.googlevideo.com (video streams)"
    echo "  ✓ img.youtube.com (thumbnails)"
    echo "Restart your browser if YouTube still loads."
    ;;
  disable)
    disable_block
    flush_dns
    echo "✅ YouTube unblocked"
    ;;
  status)
    if is_blocked; then echo "🔒 YouTube is BLOCKED"; else echo "🔓 YouTube is NOT blocked"; fi
    ;;
  *)
    echo "Usage: sudo bash $0 [enable|disable|status]"
    echo "  enable  - Block youtube.com (default)"
    echo "  disable - Unblock youtube.com"
    echo "  status  - Show current state"
    exit 1
    ;;
esac
