import { useRef, useEffect } from "react";
import Matter from "matter-js";
import Keyboard from "./Keyboard"; // Assuming you have the Keyboard component

const MatterTextInput = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const chainBodies = useRef([]); // Array of chains
  const currentChain = useRef([]); // Current chain being built
  const anchorRef = useRef(null); // Static body for anchoring the first character chain

  const keyboardHeight = 206;

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

    // Store the current chain and reset for the new chain
    if (currentChain.current.length > 0) {
      chainBodies.current.push([...currentChain.current]);
      currentChain.current = [];
    }
  };

  // Function to add a letter to the chain with a circle boundary
  const addLetterToChain = (letter) => {
    const yOffset = 25; // Vertical distance between letters
    const world = engineRef.current.world;

    // Calculate the position for the new letter above the previous one
    const latestY =
      currentChain.current.length > 0
        ? currentChain.current[0].position.y - yOffset
        : anchorRef.current.position.y + yOffset;

    // Create a circular body to represent the letter
    const letterBody = Matter.Bodies.circle(
      window.innerWidth / 2,
      latestY,
      20,
      {
        collisionFilter: { group: Matter.Body.nextGroup(true) },
        density: 0.5, // Adjusted density for stability
        friction: 0.01, // Adjusted friction for smoother movement
        restitution: 0.2, // Adjusted restitution to prevent sticking
        render: {
          visible: false, // Disable default rendering
        },
      }
    );
    letterBody.letter = letter; // Store the letter on the body

    // Add the letter body to the current chain
    currentChain.current.unshift(letterBody);

    // Add the body to the world
    Matter.Composite.add(world, letterBody);

    // Create constraints if there are previous bodies in the chain
    if (currentChain.current.length > 1) {
      const previousBody = currentChain.current[1];

      // Create a constraint between the new letter and the previous one
      Matter.Composite.add(
        world,
        Matter.Constraint.create({
          bodyA: previousBody,
          bodyB: letterBody,
          pointA: { x: 0, y: yOffset / 2 },
          pointB: { x: 0, y: -yOffset / 2 },
          stiffness: 0.6, // Adjusted stiffness for stability
          damping: 0.3, // Adjusted damping to reduce oscillation
          length: yOffset,
          render: { visible: false },
        })
      );
    }

    // Create a constraint for the first body in the chain to the anchor
    if (currentChain.current.length === 1) {
      Matter.Composite.add(
        world,
        Matter.Constraint.create({
          bodyA: anchorRef.current,
          bodyB: letterBody,
          pointA: { x: 0, y: 0 },
          pointB: { x: 0, y: -yOffset / 2 },
          stiffness: 0.2, // Adjusted stiffness for stability
          damping: 0.3, // Adjusted damping to reduce oscillation
          render: { visible: false },
        })
      );
    }
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
      Events,
    } = Matter;

    // Create engine and world
    const engine = Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    // Increase the number of iterations for constraints, velocity, and position
    engine.constraintIterations = 10; // Default is 2, increase for more stable constraint handling
    engine.velocityIterations = 8; // Default is 6, adjust for more accurate velocity simulation
    engine.positionIterations = 6; // Default is 6, adjust for more accurate position simulation

    // Lower the delta for updates to increase update frequency
    engine.timing.timeScale = 1;
    engine.timing.delta = 1000 / 120; // Fixed time step, simulating 120 FPS for more frequent updates

    // Create renderer
    if (sceneRef.current && renderRef.current === null) {
      const render = Render.create({
        element: sceneRef.current,
        engine: engine,
        options: {
          width: window.innerWidth,
          height: window.innerHeight - keyboardHeight,
          wireframes: false,
          background: "transparent",
        },
      });
      Render.run(render);
      renderRef.current = render;
    }

    // Create runner
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Create a fixed anchor point
    const anchor = Bodies.circle(window.innerWidth / 2, 20, 6, {
      isStatic: true,
      render: { fillStyle: "red" },
    });
    Composite.add(world, anchor);
    anchorRef.current = anchor;

    // Create a fixed ground
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight - 10 - keyboardHeight,
      window.innerWidth,
      20,
      {
        isStatic: true,
        render: { fillStyle: "brown" },
      }
    );
    Composite.add(world, ground);

    const leftWall = Bodies.rectangle(
      -10,
      (window.innerHeight - keyboardHeight) / 2,
      20,
      window.innerHeight - keyboardHeight,
      {
        isStatic: true,
        render: { fillStyle: "brown" },
      }
    );
    Composite.add(world, leftWall);

    const rightWall = Bodies.rectangle(
      window.innerWidth + 10,
      (window.innerHeight - keyboardHeight) / 2,
      20,
      window.innerHeight - keyboardHeight,
      {
        isStatic: true,
        render: { fillStyle: "brown" },
      }
    );
    Composite.add(world, rightWall);

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
    const handleKeyUp = (event) => {
      if (event.key === " " || event.key === "Enter") {
        disconnectChain();
      } else if (event.key.length === 1) {
        addLetterToChain(event.key);
      }
    };

    document.addEventListener("keyup", handleKeyUp);

    // Custom rendering
    const renderWorm = () => {
      const render = renderRef.current;
      const context = render.context;

      // Save the context state
      context.save();

      // Function to render a chain
      const renderChain = (chain) => {
        if (chain.length > 0) {
          // Begin the path
          context.beginPath();

          // Get positions of the bodies
          const positions = chain.map((body) => body.position);

          // Create a smooth path using quadratic curves
          context.moveTo(positions[0].x, positions[0].y);
          for (let i = 1; i < positions.length - 1; i++) {
            const xc = (positions[i].x + positions[i + 1].x) / 2;
            const yc = (positions[i].y + positions[i + 1].y) / 2;
            context.quadraticCurveTo(positions[i].x, positions[i].y, xc, yc);
          }
          // Curve through the last two points
          context.quadraticCurveTo(
            positions[positions.length - 1].x,
            positions[positions.length - 1].y,
            positions[positions.length - 1].x,
            positions[positions.length - 1].y
          );

          // Set styles
          const radius = 20; // The radius of your circles
          const borderWidth = 4; // Adjust as needed

          // First, stroke with a larger lineWidth to create the border
          context.lineWidth = radius * 2 + borderWidth * 2;
          context.strokeStyle = "#000"; // Border color
          context.lineCap = "round";
          context.lineJoin = "round";

          context.stroke();

          // Then, stroke with the fill color to fill the worm
          context.lineWidth = radius * 2;
          context.strokeStyle = "#7b5c00"; // Fill color
          context.stroke();

          // Optionally, fill the path to cover any gaps

          // Close the path
          context.closePath();

          // Render the letters on top
          chain.forEach((body) => {
            const { x, y } = body.position;
            context.save();
            context.translate(x, y);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "30px Arial";
            context.fillStyle = "#000";
            context.strokeStyle = "#fff";
            context.lineWidth = 1;
            context.strokeText(body.letter, 0, 0);
            context.fillText(body.letter, 0, 0);
            context.restore();
          });
        }
      };

      // Render all chains
      chainBodies.current.forEach((chain) => {
        renderChain(chain);
      });

      // Render the current chain
      renderChain(currentChain.current);

      // Restore the context state
      context.restore();
    };

    // Hook into the afterRender event
    Events.on(renderRef.current, "afterRender", renderWorm);

    // Clean up when the component unmounts
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        Matter.Runner.stop(runner);
        Matter.World.clear(engine.world);
        Matter.Engine.clear(engine);
        renderRef.current.canvas.remove();
        renderRef.current.textures = {};
        renderRef.current = null;
      }
    };
  }, []);

  // Handler for key presses from the custom Keyboard
  const handleKeyPress = (key) => {
    if (key === " " || key === "ENTER") {
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
