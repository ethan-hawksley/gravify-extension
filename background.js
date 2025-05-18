function gravify() {
  console.log("Gravify clicked");

  // Use correct API for what is available.
  const browserAPI = typeof browser !== "undefined" ? browser : chrome;

  browserAPI.tabs
    // Injecting scripts
    .executeScript({ file: "/lib/html-to-image.js" })
    .then(() => browserAPI.tabs.executeScript({ file: "/lib/matter.min.js" }))
    .then(() => browserAPI.tabs.executeScript({ file: "/gravify.js" }))
    .catch((e) => console.error("Gravifying had an error:", e));
}

console.log("Gravify loaded");

if (typeof browser !== "undefined") {
  browser.browserAction.onClicked.addListener(gravify);
} else {
  chrome.action.onClicked.addListener(gravify);
}
