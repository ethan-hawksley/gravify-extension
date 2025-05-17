"use strict";
console.log("gravify 2 loaded");

function checkCompatibility() {
  try {
    // Check for CSP headers that may block the script.
    const metaTags = document.querySelectorAll("meta");
    for (const metaTag of metaTags) {
      if (metaTag.httpEquiv === "Content-Security-Policy") {
        const content = metaTag.content;
        if (
          content.includes("script-src") &&
          !content.includes("'unsafe-inline'")
        ) {
          return {
            compatible: false,
            reason:
              "This page has a Content Security Policy blocking inline scripts.",
          };
        }
      }
    }
    try {
      const testDiv = document.createElement("div");
      document.body.appendChild(testDiv);
      document.body.removeChild(testDiv);
      window.getComputedStyle(document.body);
      const testCanvas = document.createElement("canvas");
      if (!testCanvas.getContext) {
        return {
          compatible: false,
          reason: "Browser doesn't support canvas.",
        };
      }

      return { compatible: true };
    } catch (e) {
      return {
        compatible: false,
        reason:
          "Cannot access or modify page elements due to security restrictions.",
      };
    }
  } catch (e) {
    return {
      compatible: false,
      reason: "Error checking compatibility: " + e.message,
    };
  }
}

const compatibilityResult = checkCompatibility();
if (!compatibilityResult.compatible) {
  alert("Gravify can't run on this page: " + compatibilityResult.reason);
  console.error(
    "Gravify compatibility check failed:",
    compatibilityResult.reason,
  );
  throw new Error("Gravify compatibility check failed");
}

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
let getting = browser.storage.sync.get({
  gravity: "1.5",
  bounciness: "0.7",
  friction: "0.05",
  airResistance: "0.02",
});
getting.then(onGot, onError);

function onError(error) {
  console.error(`Error: ${error}`);
}

function onGot(item) {
  // Diagnostic logging
  console.log(item);
  // Override default settings
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
}, 100); // 0.1s

function processElements() {
  const promises = [];
  for (const element of elements) {
    try {
      // Add padding to capture images properly
      element.style.padding = "20px";

      // Make sure images are loaded before capture
      const images = element.querySelectorAll("img");
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve; // Resolve even errors to continue.
          }
        });
      });

      // Wait for all images to load, then capture.
      promises.push(
        Promise.all(imagePromises)
          .then(() => {
            try {
              return htmlToImage.toPng(element, {
                quality: 0.9,
                cacheBust: true, // Avoid potential caching issues.
                timeout: 2000, // Timeout to prevent infinite hanging.
                onclone: (clonedDoc) => {
                  const processSafeStyles = (elem) => {
                    try {
                      const style = window.getComputedStyle(elem);
                      for (const prop of style) {
                        const value = style.getPropertyValue(prop);
                        if (
                          value === "null" ||
                          value === undefined ||
                          value === "undefined"
                        ) {
                          elem.style.setProperty(prop, "");
                        }
                      }

                      // Process children recursively
                      Array.from(elem.children).forEach(processSafeStyles);
                    } catch (e) {
                      // Silently fail for individual elements
                    }
                  };

                  const clonedElem = clonedDoc.querySelector(
                    `[data-html2canvas-node-id="${element.getAttribute("data-html2canvas-node-id")}"]`,
                  );
                  if (clonedElem) {
                    processSafeStyles(clonedElem);
                  }

                  return clonedDoc;
                },
              });
            } catch (htmlToImageError) {
              console.error("Internal html-to-image error:", htmlToImageError);

              // Fallback rectangle for errors.
              return createFallbackImage(element);
            }
          })
          .catch((e) => {
            console.error("Error converting element to image", e);

            return createFallbackImage(element);
          }),
      );
    } catch (error) {
      console.error("Error setting up element for conversion:", error);
      promises.push(Promise.resolve(createFallbackImage(element)));
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
        alert("No valid elements available for simulation.");
      }
    })
    .catch((error) => {
      console.error("Error processing images:", error);
      alert("Error processing page elements.");
    });
}

function createFallbackImage(element) {
  const { width, height } = element.getBoundingClientRect();

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(width, 50);
  canvas.height = Math.max(height, 50);

  const ctx = canvas.getContext("2d");

  // Random pastel color
  const hue = Math.floor(Math.random() * 360);
  ctx.fillStyle = `hsl(${hue}, 70% 80%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png", 1.0);
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
    console.log("settings retrieved are ", fetchedSettings);
    engine.world.gravity.y = fetchedSettings.gravity;

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
            restitution: Number(fetchedSettings.bounciness),
            friction: Number(fetchedSettings.friction),
            frictionAir: Number(fetchedSettings.airResistance),
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

    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    document.addEventListener("auxclick", (event) => {
      event.preventDefault();
      if (event.button === 1) {
        location.reload();
      } else {
        const bodies = Matter.Composite.allBodies(engine.world);
        for (let i = 0; i < bodies.length; i++) {
          const body = bodies[i];

          if (!body.isStatic) {
            const forceMagnitude = 0.5 * body.mass;

            Matter.Body.applyForce(body, body.position, {
              x: (Math.random() - 0.5) * forceMagnitude,
              y: (Math.random() - 0.5) * forceMagnitude,
            });
          }
        }
      }
    });

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
