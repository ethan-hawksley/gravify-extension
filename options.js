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
  function onError(error) {
    console.error(`Error: ${error}`);
  }

  let getting = browser.storage.sync.get({
    gravity: "3",
    bounciness: "0.5",
    friction: "0.05",
    airResistance: "0.05",
  });
  getting.then(setOptions, onError);
}

function setOptions(options) {
  document.querySelector("#gravity").value = options.gravity || "3";
  document.querySelector("#bounciness").value = options.bounciness || "0.5";
  document.querySelector("#friction").value = options.friction || "0.05";
  document.querySelector("#air-resistance").value =
    options.airResistance || "0.05";
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

document.querySelector("#moon-preset").addEventListener("click", () => setOptions({
  gravity: 1,
  bounciness: 0.7,
  friction: 0.05,
  airResistance: 0.05,
}));

document.querySelector("#jupiter-preset").addEventListener("click", () => setOptions({
  gravity: 6,
  bounciness: 0.4,
  friction: 0.2,
  airResistance: 0.2,
}));