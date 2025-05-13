function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    gravity: document.querySelector("#gravity").value,
    bounciness: document.querySelector("#bounciness").value,
    friction: document.querySelector("#friction").value,
    airResistance: document.querySelector("#air-resistance").value,
  });
}

function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#gravity").value = result.gravity || "3";
    document.querySelector("#bounciness").value = result.bounciness || "0.5";
    document.querySelector("#friction").value = result.friction || "0.05";
    document.querySelector("#air-resistance").value =
      result.airResistance || "0.02";
  }

  function onError(error) {
    console.error(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get({
    gravity: "3",
    bounciness: "0.5",
    friction: "0.05",
    airResistance: "0.02",
  });
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
