import { useRef, useEffect } from "react";
import Matter from "matter-js";
import Keyboard from "./Keyboard"; // Assuming you have the Keyboard component

const MatterTextInput = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const chainBodies = useRef([]); // To store the bodies in the chain
  const anchorRef = useRef(null); // Static body for anchoring the first character chain

  // Function to disconnect the chain from the fixed point
  const disconnectChain = () => {
    const world = engineRef.current.world;
    const constraintsToRemove = world.constraints.filter(
      (constraint) =>
        constraint.bodyA === anchorRef.current ||
        constraint.bodyB === anchorRef.current
    );
    constraintsToRemove.forEach((constraint) =>
      Matter.Composite.remove(world, constraint)
    );

    // Reset chainBodies to allow new chains to be created
    chainBodies.current = [];
  };

  // Function to add a letter to the chain with a circle boundary
  const addLetterToChain = (letter) => {
    const yOffset = 30; // Vertical distance between letters
    const world = engineRef.current.world;

    // Calculate the position for the new letter above the previous one
    const latestY =
      chainBodies.current.length > 0
        ? chainBodies.current[0].position.y - yOffset
        : anchorRef.current.position.y + yOffset;

    // Create a circular body to encompass the letter
    const letterBody = Matter.Bodies.circle(150, latestY, 20, {
      collisionFilter: { group: Matter.Body.nextGroup(true) },
      density: 1.01, // Increased density for more solidity
      friction: 2.8, // Increased friction to reduce sliding
      restitution: 0.01, // Reduced bounciness
      render: {
        sprite: {
          texture: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
                        <circle cx='20' cy='20' r='18' fill='none' stroke='none' stroke-width='2'/>
                        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='50' fill='white' stroke = 'black' stroke-width='3' font-family='Comic Sans MS' font-weight='bold'>${letter}</text>
                     </svg>`
          )}`,
        },
      },
    });

    // Add the letter to the start of the array to maintain the newest at the top
    chainBodies.current.unshift(letterBody);

    // Remove old constraints and add new constraints to reorganize the chain
    Matter.Composite.clear(world, false, true);

    // Re-add the anchor
    Matter.Composite.add(world, anchorRef.current);

    // Reconnect each letter, keeping the latest letter connected to the anchor
    chainBodies.current.forEach((body, index) => {
      if (index === 0) {
        // Connect the first letter to the anchor
        Matter.Composite.add(
          world,
          Matter.Constraint.create({
            bodyA: anchorRef.current,
            bodyB: body,
            pointA: { x: 0, y: 0 },
            pointB: { x: 0, y: -yOffset / 2 },
            stiffness: 1, // High stiffness for less elasticity
            damping: 0.5, // Damping to reduce oscillation
            render: { visible: false },
          })
        );
      } else {
        // Connect each letter to the previous one in the array
        Matter.Composite.add(
          world,
          Matter.Constraint.create({
            bodyA: chainBodies.current[index - 1],
            bodyB: body,
            pointA: { x: 0, y: yOffset / 2 },
            pointB: { x: 0, y: -yOffset / 2 },
            length: yOffset,
            stiffness: 1, // High stiffness for less elasticity
            damping: 0.5, // Damping to reduce oscillation
            render: { visible: false },
          })
        );
      }

      // Add the body back to the world
      Matter.Composite.add(world, body);
    });
  };

  useEffect(() => {
    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
    } = Matter;

    // Create engine and world
    const engine = Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    // Ensure we are properly targeting the specific div and not creating extra canvas
    if (sceneRef.current && renderRef.current === null) {
      // Create renderer
      const render = Render.create({
        element: sceneRef.current, // Correctly target the ref div
        engine: engine,
        options: {
          width: window.innerWidth,
          height: window.innerHeight / 2, // Adjusted to allow space for the keyboard
          wireframes: false,
          background: "transparent",
        },
      });
      Render.run(render);
      renderRef.current = render; // Store render in ref so we don't create another
    }

    // Create runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Create a fixed anchor point
    const anchor = Bodies.circle(150, 100, 5, {
      isStatic: true,
      render: { fillStyle: "red" },
    });
    Composite.add(world, anchor);
    anchorRef.current = anchor;

    // Create a fixed ground
    const ground = Bodies.rectangle(150, window.innerHeight - 50, 300, 20, {
      isStatic: true,
      render: { fillStyle: "brown" },
    });
    Composite.add(world, ground);

    // Add mouse control
    const mouse = Mouse.create(renderRef.current.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Composite.add(world, mouseConstraint);
    renderRef.current.mouse = mouse;

    // Handle physical keyboard input
    const handleKeyDown = (event) => {
      if (event.key.length === 1) {
        addLetterToChain(event.key); // Add letter to chain on key press
      } else if (event.key === " " || event.key === "Enter") {
        disconnectChain(); // Disconnect chain on space or enter
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Clean up when the component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        Matter.Runner.stop(runner);
        Matter.Engine.clear(engine);
        renderRef.current.canvas.remove(); // Properly remove the canvas from the DOM
        renderRef.current.textures = {};
        renderRef.current = null;
      }
    };
  }, []);

  // Handler for key presses from the custom Keyboard
  const handleKeyPress = (key) => {
    if (key === " " || key === "\n") {
      disconnectChain(); // Disconnect chain on space or enter
    } else {
      addLetterToChain(key); // Add letter to chain
    }
  };

  return (
    <div>
      <div ref={sceneRef} />
      <Keyboard onKeyPress={handleKeyPress} />
    </div>
  );
};

export default MatterTextInput;
