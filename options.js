function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    gravity: document.querySelector("#gravity").value,
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#gravity").value = result.gravity || "3"
  }
  
  function onError(error) {
    console.error(`Error: ${error}`)
  }
  
  let getting = browser.storage.sync.get("gravity")
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.querySelector("form").addEventListener("submit", saveOptions)