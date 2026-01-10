const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAdhanAudio(config) {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const rawDir = path.join(
                config.modRequest.platformProjectRoot,
                'app/src/main/res/raw'
            );

            if (!fs.existsSync(rawDir)) {
                fs.mkdirSync(rawDir, { recursive: true });
            }

            // Source: assets/sounds/adhan.mp3 (Adjust based on your project structure)
            const source = path.join(config.modRequest.projectRoot, 'assets/sounds/adhan.mp3');
            const dest = path.join(rawDir, 'adhan.mp3');

            if (fs.existsSync(source)) {
                fs.copyFileSync(source, dest);
                console.log('✅ Copied adhan.mp3 to Android res/raw');
            } else {
                console.warn('⚠️ adhan.mp3 not found in assets/sounds/');
            }

            return config;
        },
    ]);
};
