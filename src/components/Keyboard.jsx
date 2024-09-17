const keys = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", " "],
];

function CustomKeyboard({ onKeyPress }) {
  return (
    <div
      className="keyboard"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {keys.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{ display: "flex", justifyContent: "center" }}
        >
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              style={{
                padding: "10px",
                margin: "5px",
                fontSize: "20px",
              }}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default CustomKeyboard;
