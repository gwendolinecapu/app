/**
 * Script pour ajouter automatiquement le target Apple Watch au projet Xcode
 * Utilise le package xcode pour manipuler le fichier .pbxproj
 * 
 * Usage: node scripts/setup-watch-app.js
 */

const xcode = require('xcode');
const path = require('path');
const fs = require('fs');

const PROJECT_PATH = path.join(__dirname, '../ios/PluralConnect.xcodeproj/project.pbxproj');
const WATCH_APP_NAME = 'PluralConnectWatch';
const WATCH_BUNDLE_ID = 'com.pluralconnect.app.watchkitapp';

async function setupWatchApp() {
    console.log('🕐 Configuration du target Apple Watch...\n');

    // Vérifier que le projet existe
    if (!fs.existsSync(PROJECT_PATH)) {
        console.error('❌ Projet Xcode non trouvé. Exécutez d\'abord: npx expo prebuild');
        process.exit(1);
    }

    // Charger le projet
    const project = xcode.project(PROJECT_PATH);
    project.parseSync();

    // Vérifier si le target existe déjà
    const targets = project.pbxNativeTargetSection();
    const watchTargetExists = Object.values(targets).some(
        t => t.name === WATCH_APP_NAME
    );

    if (watchTargetExists) {
        console.log('✅ Le target watchOS existe déjà!');
        return;
    }

    console.log('📱 Ajout du target watchOS...');

    // Note: Le package xcode ne supporte pas complètement la création de targets watchOS
    // On va plutôt générer les instructions pour l'utilisateur
    console.log('\n⚠️  La création automatique de targets watchOS n\'est pas supportée par le package xcode.');
    console.log('\n📋 Instructions manuelles:\n');
    console.log('1. Ouvrir Xcode: open ios/PluralConnect.xcworkspace');
    console.log('2. File → New → Target → watchOS → App');
    console.log('3. Nommer: PluralConnectWatch');
    console.log('4. Bundle ID: com.pluralconnect.app.watchkitapp');
    console.log('5. Ajouter les fichiers Swift de ios/PluralConnectWatch/');
    console.log('6. Configurer App Groups');

    // Créer les fichiers d'assets et Info.plist pour le target watch
    await createWatchAppAssets();

    console.log('\n✅ Fichiers de configuration créés!');
}

async function createWatchAppAssets() {
    const watchDir = path.join(__dirname, '../ios/PluralConnectWatch');

    // Créer Assets.xcassets
    const assetsDir = path.join(watchDir, 'Assets.xcassets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Contents.json pour Assets
    fs.writeFileSync(
        path.join(assetsDir, 'Contents.json'),
        JSON.stringify({
            "info": {
                "author": "xcode",
                "version": 1
            }
        }, null, 2)
    );

    // AccentColor
    const accentDir = path.join(assetsDir, 'AccentColor.colorset');
    if (!fs.existsSync(accentDir)) {
        fs.mkdirSync(accentDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(accentDir, 'Contents.json'),
        JSON.stringify({
            "colors": [{
                "color": {
                    "color-space": "srgb",
                    "components": { "red": "0.545", "green": "0.361", "blue": "0.965", "alpha": "1.000" }
                },
                "idiom": "universal"
            }],
            "info": { "author": "xcode", "version": 1 }
        }, null, 2)
    );

    // AppIcon
    const iconDir = path.join(assetsDir, 'AppIcon.appiconset');
    if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
    }
    fs.writeFileSync(
        path.join(iconDir, 'Contents.json'),
        JSON.stringify({
            "images": [
                { "idiom": "watch", "scale": "2x", "size": "24x24", "role": "notificationCenter", "subtype": "38mm" },
                { "idiom": "watch", "scale": "2x", "size": "27.5x27.5", "role": "notificationCenter", "subtype": "42mm" },
                { "idiom": "watch", "scale": "2x", "size": "29x29", "role": "companionSettings" },
                { "idiom": "watch", "scale": "3x", "size": "29x29", "role": "companionSettings" },
                { "idiom": "watch", "scale": "2x", "size": "40x40", "role": "appLauncher", "subtype": "38mm" },
                { "idiom": "watch", "scale": "2x", "size": "44x44", "role": "appLauncher", "subtype": "40mm" },
                { "idiom": "watch", "scale": "2x", "size": "50x50", "role": "appLauncher", "subtype": "44mm" },
                { "idiom": "watch", "scale": "2x", "size": "86x86", "role": "quickLook", "subtype": "38mm" },
                { "idiom": "watch", "scale": "2x", "size": "98x98", "role": "quickLook", "subtype": "42mm" },
                { "idiom": "watch", "scale": "2x", "size": "108x108", "role": "quickLook", "subtype": "44mm" }
            ],
            "info": { "author": "xcode", "version": 1 }
        }, null, 2)
    );

    // Info.plist
    const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>PluralConnect</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>WKApplication</key>
    <true/>
    <key>WKWatchOnly</key>
    <false/>
</dict>
</plist>`;

    fs.writeFileSync(path.join(watchDir, 'Info.plist'), infoPlist);
    console.log('   ✓ Info.plist créé');
    console.log('   ✓ Assets.xcassets créé');
}

// Exécuter
setupWatchApp().catch(console.error);
