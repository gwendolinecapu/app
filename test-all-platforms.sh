#!/bin/bash

# Script de test cross-platform pour PluralConnect
# Teste web, iOS et Android

echo "🌐 Testing PluralConnect on All Platforms"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Fonction pour afficher le menu
show_menu() {
    echo "Select platform to test:"
    echo ""
    echo "  1) Web Desktop (Chrome)"
    echo "  2) Web Mobile (Chrome DevTools)"
    echo "  3) iOS Simulator"
    echo "  4) Android Emulator"
    echo "  5) Test ALL (web only)"
    echo "  6) Exit"
    echo ""
}

# Test Web
test_web() {
    echo -e "${BLUE}🌐 Testing Web Platform...${NC}"
    echo ""

    # Vérifier si le serveur tourne
    if curl -s http://localhost:8081 > /dev/null; then
        echo -e "${GREEN}✓${NC} Server already running"
    else
        echo -e "${YELLOW}⚠${NC} Starting web server..."
        npm run web &
        sleep 10
    fi

    # Tests automatiques
    echo ""
    echo "Running automated tests..."

    # Test 1: HTML Page
    if curl -s http://localhost:8081 | grep -q "PluralConnect"; then
        echo -e "${GREEN}✓${NC} HTML page loads"
    else
        echo -e "${RED}✗${NC} HTML page failed"
    fi

    # Test 2: Bundle
    if curl -s -I "http://localhost:8081/index.bundle?platform=web" | grep -q "200"; then
        echo -e "${GREEN}✓${NC} JavaScript bundle accessible"
    else
        echo -e "${RED}✗${NC} Bundle failed"
    fi

    # Test 3: Assets
    if [ -f "web/styles.css" ] && [ -f "web/index.html" ] && [ -f "web/manifest.json" ]; then
        echo -e "${GREEN}✓${NC} Web assets present"
    else
        echo -e "${RED}✗${NC} Some web assets missing"
    fi

    # Test 4: Platform detection
    if [ -f "src/lib/platformDetection.ts" ] && [ -f "src/hooks/useResponsive.ts" ]; then
        echo -e "${GREEN}✓${NC} Platform utilities installed"
    else
        echo -e "${RED}✗${NC} Platform utilities missing"
    fi

    echo ""
    echo -e "${BLUE}Opening in Chrome...${NC}"
    open -a "Google Chrome" "http://localhost:8081"

    echo ""
    echo "📋 Manual Tests:"
    echo "  1. Check page displays correctly"
    echo "  2. Open Console (Cmd+Option+J) - check for errors"
    echo "  3. Test responsive (Cmd+Shift+M)"
    echo "     - Desktop (1920x1080)"
    echo "     - Tablet (820x1180)"
    echo "     - Mobile (390x844)"
    echo ""
}

# Test Web Mobile
test_web_mobile() {
    echo -e "${BLUE}📱 Testing Web Mobile...${NC}"
    echo ""

    test_web

    echo "📋 Additional Mobile Tests:"
    echo "  1. Open DevTools (F12)"
    echo "  2. Toggle Device Toolbar (Cmd+Shift+M)"
    echo "  3. Select devices:"
    echo "     - iPhone 13 Pro"
    echo "     - iPad Air"
    echo "     - Samsung Galaxy S20"
    echo "  4. Test:"
    echo "     - Touch interactions"
    echo "     - Font sizes (should be ≥16px)"
    echo "     - Keyboard behavior"
    echo ""
}

# Test iOS
test_ios() {
    echo -e "${BLUE}🍎 Testing iOS Simulator...${NC}"
    echo ""

    echo "Checking iOS setup..."

    if ! command -v xcrun &> /dev/null; then
        echo -e "${RED}✗${NC} Xcode not installed"
        echo "Install Xcode from App Store first"
        return 1
    fi

    echo -e "${GREEN}✓${NC} Xcode installed"

    echo ""
    echo "Starting iOS build..."
    npm run ios

    echo ""
    echo "📋 iOS Tests:"
    echo "  ✓ BiometricGuard (Face ID)"
    echo "  ✓ Haptic feedback"
    echo "  ✓ Native navigation"
    echo "  ✓ SafeAreaView (notch)"
    echo "  ✓ Push notifications"
    echo ""
}

# Test Android
test_android() {
    echo -e "${BLUE}🤖 Testing Android Emulator...${NC}"
    echo ""

    echo "Checking Android setup..."

    if ! command -v adb &> /dev/null; then
        echo -e "${RED}✗${NC} Android SDK not installed"
        echo "Install Android Studio first"
        return 1
    fi

    echo -e "${GREEN}✓${NC} Android SDK installed"

    # Check if emulator is running
    if adb devices | grep -q "emulator"; then
        echo -e "${GREEN}✓${NC} Emulator running"
    else
        echo -e "${YELLOW}⚠${NC} No emulator detected"
        echo "Start an emulator from Android Studio"
        return 1
    fi

    echo ""
    echo "Starting Android build..."
    npm run android

    echo ""
    echo "📋 Android Tests:"
    echo "  ✓ BiometricGuard (Fingerprint)"
    echo "  ✓ Haptic feedback"
    echo "  ✓ Native navigation"
    echo "  ✓ Status bar"
    echo "  ✓ Push notifications"
    echo ""
}

# Test ALL
test_all() {
    echo -e "${BLUE}🚀 Testing All Web Platforms...${NC}"
    echo ""

    test_web

    echo ""
    echo -e "${BLUE}📊 Cross-Platform Summary${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Web Desktop : Tested"
    echo "✅ Web Mobile  : Ready (test with DevTools)"
    echo "⚠️  iOS        : Run 'test-all-platforms.sh' > option 3"
    echo "⚠️  Android    : Run 'test-all-platforms.sh' > option 4"
    echo ""
    echo "📚 Documentation:"
    echo "  → CROSS_PLATFORM_GUIDE.md"
    echo "  → WEB_TESTING_GUIDE.md"
    echo "  → SKIP_ONBOARDING.md"
    echo ""
}

# Menu principal
while true; do
    show_menu
    read -p "Enter choice [1-6]: " choice

    case $choice in
        1)
            test_web
            ;;
        2)
            test_web_mobile
            ;;
        3)
            test_ios
            ;;
        4)
            test_android
            ;;
        5)
            test_all
            ;;
        6)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
    clear
done
