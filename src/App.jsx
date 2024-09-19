import { useState } from "react";
import LandingPage from "./components/LandingPage";
import MatterTextInput from "./components/MatterTextInput";
import EndPage from "./components/EndPage";
import "./App.css";

function App() {
  const [page, setPage] = useState(2);

  const nextPage = () => {
    setPage(page + 1);
  };

  return (
    <div>
      {page === 1 && <LandingPage nextPage={nextPage} />}
      {page === 2 && <MatterTextInput nextPage={nextPage} />}
      {page === 3 && <EndPage />}
    </div>
  );
}

export default App;
