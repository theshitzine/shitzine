import { useState } from "react";

const keys = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["SHIFT", "z", "x", "c", "v", "b", "n", "m"],
  [",", " ", ".", "ENTER"],
];

// SHIFT alternates for numbers and symbols
const shiftAlternates = {
  1: "!",
  2: "@",
  3: "#",
  4: "$",
  5: "%",
  6: "^",
  7: "&",
  8: "*",
  9: "(",
  0: ")",
  "-": "_",
  "=": "+",
  "[": "{",
  "]": "}",
  "\\": "|",
  ";": ":",
  "'": '"',
  ",": "<",
  ".": ">",
  "/": "?",
  "`": "~",
};

function CustomKeyboard({ onKeyPress }) {
  const [shiftActive, setShiftActive] = useState(false);

  const handleKeyPress = (key) => {
    if (key === "SHIFT") {
      setShiftActive(!shiftActive);
      return;
    }

    if (shiftActive) {
      // If SHIFT is active, use alternates or uppercase letters
      if (shiftAlternates[key]) {
        onKeyPress(shiftAlternates[key]);
      } else {
        onKeyPress(key.toUpperCase());
      }
      setShiftActive(false); // Deactivate SHIFT after one press
    } else {
      onKeyPress(key);
    }
  };

  const renderKey = (key) => {
    // If SHIFT is active, display alternates or capitalized letters
    if (shiftActive) {
      if (shiftAlternates[key]) {
        return shiftAlternates[key];
      } else if (key.match(/[a-z]/)) {
        return key.toUpperCase();
      }
    }
    return key;
  };

  return (
    <div className="keyboard" style={{ flexDirection: "column" }}>
      {/* Key Rows */}
      {keys.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{ display: "flex", justifyContent: "center" }}
        >
          {row.map((key) => (
            <button
              id={key === " " ? "space" : key}
              key={key}
              onClick={() => handleKeyPress(key)}
              className="keyboard-button"
              style={{
                width:
                  key === "SHIFT" || key === "ENTER"
                    ? "fit-content"
                    : "calc(1em + 7px)",
                backgroundColor: key === "SHIFT" && shiftActive ? "#ccc" : "", // Only change the SHIFT key background
              }}
            >
              {renderKey(key)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default CustomKeyboard;
