import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import MatterTextInput from "./components/MatterTextInput";
import EndPage from "./components/EndPage";
import { auth } from "./components/firebase";
import { signInAnonymously } from "firebase/auth"; // Import signInAnonymously
import "./App.css";

function App() {
  const [page, setPage] = useState(2);

  const nextPage = () => {
    setPage(page + 1);
    console.log("next");
  };

  useEffect(() => {
    signInAnonymously(auth).catch((error) => {
      console.error("Error signing in anonymously:", error);
    });
  }, []);

  return (
    <div>
      <audio id="submit-sound" preload="auto">
        <source src="/toilet-flush.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {page === 1 && <LandingPage nextPage={nextPage} />}
      {page === 2 && <MatterTextInput nextPage={nextPage} />}
      {page === 3 && <EndPage />}
    </div>
  );
}

export default App;
