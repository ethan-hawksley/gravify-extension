function gravify() {
  console.log("Gravify clicked");
  browser.tabs
    // Injecting scripts
    .executeScript({ file: "/lib/html-to-image.js" })
    .then(() => browser.tabs.executeScript({ file: "/lib/matter.min.js" }))
    .then(() => browser.tabs.executeScript({ file: "/gravify2.js" }))
    .catch((e) => console.error("Gravifying had an error:", e));
}

console.log("Gravify loaded");
browser.browserAction.onClicked.addListener(gravify);
