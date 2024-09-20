import { useRef, useEffect, useState } from "react";
import Matter from "matter-js";
import Keyboard from "./Keyboard"; // Assuming you have the Keyboard component
import { firestore } from "./firebase"; // Import Firebase auth and Firestore
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions
import "./flushAnimation.css";

const MatterTextInput = ({ nextPage }) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const chainBodies = useRef([]); // Array to store multiple chains
  const currentChain = useRef([]); // Current chain being built
  const anchorRef = useRef(null); // Static body for anchoring the first character chain

  // State to store the text typed by the user
  const [text, setText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(""); // State to store the selected question
  const [isFlushing, setIsFlushing] = useState(false); // State to track flushing animation
  const [isStretching, setIsStretching] = useState(false); // State to trigger the stretch animation
  const keyboardHeight = 206;

  useEffect(() => {
    const questions = [
      "tell us about the strangest place you've ever had to go!",
      "what's the weirdest thing you've ever done to unclog yourself?",
      "describe a time when nature called at the worst possible moment!",
      "what's your survival story from a bathroom emergency?",
      "tell us about your most memorable public bathroom adventure!",
    ];

    // Select a random question on page load
    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];
    setSelectedQuestion(randomQuestion);
  }, []);

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
    const yOffset = 24; // Vertical distance between letters
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
        density: 5.0, // Adjusted density for heavier worm
        friction: 2, // Adjusted friction to reduce sliding
        restitution: 0.01, // Reduced bounciness
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
          stiffness: 0.1, // Decreased stiffness for less elasticity
          damping: 0, // Increased damping to reduce springiness
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
          stiffness: 0.05, // Decreased stiffness
          damping: 0.8, // Increased damping
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
    engine.constraintIterations = 15; // Increased for more stable constraint handling
    engine.velocityIterations = 8; // Default is 6, adjust for more accurate velocity simulation
    engine.positionIterations = 10; // Increased for more accurate position solving

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
      window.innerHeight - keyboardHeight + 95,
      window.innerWidth,
      200,
      {
        isStatic: true,
        render: { fillStyle: "transparent" },
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
        if (event.key === "Enter") {
          setText((prevText) => prevText + "\n"); // Add a line break to the text
        } else if (event.key === " ") {
          setText((prevText) => prevText + " "); // Add a space to the text
        }
      } else if (event.key.length === 1) {
        addLetterToChain(event.key);
        setText((prevText) => prevText + event.key); // Append the letter to the text
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
          const radius = 22; // The radius of your circles
          const borderWidth = 4; // Adjust as needed

          // First, stroke with a larger lineWidth to create the border
          context.lineWidth = radius * 2 + borderWidth * 2;
          context.strokeStyle = "#000"; // Border color
          context.lineCap = "round";
          context.lineJoin = "round";

          context.stroke();

          // Then, stroke with the fill color to fill the worm
          context.lineWidth = radius * 2;
          context.strokeStyle = "#7B5C00"; // Fill color
          context.stroke();

          // Close the path
          context.closePath();

          // Render the letters on top
          chain.forEach((body) => {
            const { x, y } = body.position;
            context.save();
            context.translate(x, y);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font = "24px Aspekta Variable";
            context.fillStyle = "#fff";
            context.lineWidth = 1;
            context.strokeText(body.letter.toUpperCase(), 0, 0);
            context.fillText(body.letter.toUpperCase(), 0, 0);
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
      if (key === "ENTER") {
        setText((prevText) => prevText + "\n"); // Add a line break to the text
      } else if (key === " ") {
        setText((prevText) => prevText + " "); // Add a space to the text
      }
    } else {
      addLetterToChain(key); // Add letter to chain
      setText((prevText) => prevText + key); // Append the letter to the text
    }
  };

  // Function to handle submitting the message
  const handleSubmit = async () => {
    if (text.trim()) {
      try {
        // Submit the message to Firestore under the section corresponding to the selected question
        // await addDoc(
        //   collection(firestore, `questions/${selectedQuestion}/messages`),
        //   {
        //     text: text,
        //     createdAt: serverTimestamp(), // Use serverTimestamp for creation time
        //   }
        // );

        console.log("Message submitted to Firestore");

        // Reset the text input after submission
        setText("");

        setIsFlushing(true);

        // Play a sound on submit
        playSubmitSound();

        setTimeout(() => {
          setIsStretching(true);
          window.scrollTo({
            top: 0,
            behavior: "smooth", // Smooth scroll to the top of the page
          });
        }, 1000);

        setTimeout(() => {
          nextPage();
        }, 4000);
      } catch (error) {
        console.error("Error submitting message to Firestore:", error);
      }
    }
  };

  const playSubmitSound = () => {
    const audioElement = document.getElementById("submit-sound");
    audioElement.currentTime = 0; // Reset the audio to the start in case it's already been played
    audioElement.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  };

  return (
    <>
      <div
        className={isFlushing ? "flushed" : ""}
        style={{ transition: "all 4s ease" }}
      >
        <div id="question">
          <div style={{ padding: "20px", textAlign: "center" }}>
            {selectedQuestion}
          </div>
        </div>
        <div ref={sceneRef}></div>
        <Keyboard onKeyPress={handleKeyPress} />
        <button onClick={handleSubmit}>SUBMIT?</button>
      </div>
      {isStretching && <div className="stretching"></div>}
    </>
  );
};

export default MatterTextInput;
