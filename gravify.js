"use strict";
console.log("gravify 2 loaded");

const elements = [];
const ignoreTags = ["DIV", "NOSCRIPT", "SCRIPT", "META", "LINK"];

function findChildlessElements(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

  // Skip hidden elements
  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    element.offsetWidth === 0 ||
    element.offsetHeight === 0
  ) {
    return;
  }

  if (element.children.length === 0) {
    if (ignoreTags.includes(element.tagName)) {
      return;
    }
    elements.push(element);
  } else {
    Array.from(element.children).forEach((child) => {
      findChildlessElements(child);
    });
  }
}

let fetchedSettings = {
  gravity: 1,
};

// Fetch settings from browser storage
const getting = browser.storage.sync.get("gravity");
getting.then(onGot, onError);

function onError(error) {
  console.error(`Error: ${error}`);
}

function onGot(item) {
  // Diagnostic logging
  console.log(item);
  fetchedSettings = item;
}

// Give the page time to fully render before processing
setTimeout(() => {
  try {
    findChildlessElements(document.body);
    console.log(`Found ${elements.length} elements to process`);
    processElements();
  } catch (error) {
    console.error("Error in initial element search:", error);
  }
}, 500); // 0.5s

function processElements() {
  const promises = [];
  for (const element of elements) {
    try {
      // Add padding so images are captured properly
      element.style.padding = "20px";

      // Make sure images are loaded before capture
      const images = element.querySelectorAll("img");
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to continue
          }
        });
      });

      // Wait for all images in this element to load, then capture
      promises.push(
        Promise.all(imagePromises)
          .then(() =>
            htmlToImage.toPng(element, {
              quality: 0.9,
              cacheBust: true, // Avoid caching issues
            }),
          )
          .catch((e) => {
            console.error("Error converting element to image", e);
            return null;
          }),
      );
    } catch (error) {
      console.error("Error setting up element for conversion:", error);
      // Push an empty promise so that all of them resolve anyways
      promises.push(Promise.resolve(null));
    }
  }

  let pageElements = [];
  Promise.all(promises)
    .then((urls) => {
      const validUrls = urls.filter((url) => url !== null);
      console.log(
        `Successfully converted ${validUrls.length} of ${elements.length} elements`,
      );

      for (let i = 0; i < elements.length; i++) {
        if (urls[i]) {
          // Validate URL data before adding
          if (urls[i].length > 100) {
            // Basic check for non-empty image data
            pageElements.push({
              url: urls[i],
              coords: elements[i].getBoundingClientRect(),
            });
          } else {
            console.warn(`Skipping element ${i} - invalid image data`);
          }
        }
      }

      console.log(
        `Created ${pageElements.length} valid page elements for simulation`,
      );
      if (pageElements.length > 0) {
        startPhysics(pageElements);
      } else {
        console.error("No valid elements available for simulation");
      }
    })
    .catch((error) => {
      console.error("Error processing images:", error);
    });
}

function startPhysics(pageElements) {
  if (!pageElements || pageElements.length === 0) {
    console.error("No available elements to simulate");
    window.alert("No available elements to simulate");
    return;
  }

  const container = document.createElement("div");
  container.id = "container";
  document.body.replaceChildren(container);

  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  // Place ahead of other elements
  container.style.zIndex = "9999";

  try {
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create();
    // implement a config menu
    engine.world.gravity.y = 3;

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    container.appendChild(canvas);

    const render = Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: "#f0f0f0",
      },
    });

    const floor = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 10,
      window.innerWidth,
      80,
      {
        isStatic: true,
        render: { fillStyle: "#f0f0f0" },
      },
    );

    const ceiling = Bodies.rectangle(
      window.innerWidth / 2,
      -40,
      window.innerWidth,
      80,
      {
        isStatic: true,
        render: { fillStyle: "#f0f0f0" },
      },
    );

    const leftWall = Bodies.rectangle(
      -40,
      window.innerHeight / 2,
      80,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#f0f0f0" },
      },
    );

    const rightWall = Bodies.rectangle(
      window.innerWidth + 40,
      window.innerHeight / 2,
      80,
      window.innerHeight,
      {
        isStatic: true,
        render: { fillStyle: "#f0f0f0" },
      },
    );

    World.add(engine.world, [floor, ceiling, leftWall, rightWall]);

    pageElements.forEach(async (element) => {
      try {
        function getSize(url) {
          return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = () =>
              resolve({ width: img.width, height: img.height });
            img.onerror = () => reject();
            img.src = url;
          });
        }
        const dimensions = await getSize(element.url);

        console.log(dimensions);

        const shape = Bodies.rectangle(
          window.innerWidth / 2,
          window.innerHeight / 2,
          Math.max(dimensions.width / 2, 20),
          Math.max(dimensions.height / 2, 20),
          {
            // Implement different weights
            density: (dimensions.width * dimensions.height) / 20,
            render: {
              sprite: {
                texture: element.url,
              },
            },
          },
        );

        World.add(engine.world, [shape]);
      } catch (e) {
        console.error(e);
      }
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.3,
        render: {
          visible: false,
        },
      },
    });

    World.add(engine.world, mouseConstraint);

    render.mouse = mouse;

    const runner = Runner.create();
    Runner.run(runner, engine);

    function renderScene() {
      Render.world(render);
    }

    setInterval(renderScene, 16);

    console.log("Initialised!");
  } catch (e) {
    console.error("Error in startPhysics", e);
  }
}
