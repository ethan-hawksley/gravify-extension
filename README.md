# Gravify Extension
(Only supports Firefox currently)

The Gravify extension is a browser extension that transforms an ordinary webpage into a 2D physics sandbox of all the elements on the page!

## Installation
### Temporary (Recommended)
Download the .zip extension file from GitHub Releases.
Navigate to `about:debugging` in the Firefox browser. Go to the `This Firefox` section on the side, and click `Load Temporary Add-on`. Select the downloaded .zip file. The extension will be installed until the browser is restarted.
### Permanent (Advanced Users Only)
Download the .zip extension file from GitHub Releases.
Navigate to `about:config` in the Firefox browser. Accept the warning and search `xpinstall.signatures.required`. Set the corresponding setting to false. Navigate to `about:addons`, click the cog icon, and select `Install Add-on from file`. Select the downloaded .zip file. The extension will be installed permanently.

## Usage
(Note: due to CSP headers not all sites are supported by the extension. Some that are supported are https://hackatime.hackclub.com https://www.wikipedia.org https://docs.github.com )

Load the desired the website. Then, select the extension's icon from the extensions button on the toolbar. If the page is supported, all the elements of the page will be transformed into a 2D canvas letting you play with the elements of the page!

## Configuration
All configuration for the extension is located in the extension's settings menu. To access, navigate to `about:addons`, click the Gravify extension and navigate to the Preferences tab. There, you can adjust the settings that the simulation uses.
1. Gravity - The downwards gravity of the simulation.
2. Bounciness - How bouncy different objects are when they interact.
3. Friction - How high the friction between objects are.
4. Air Resistance - How much drag objects experience in the air.