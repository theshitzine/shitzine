function LandingPage({ nextPage }) {
  return (
    <div
      style={{
        textAlign: "center",
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h1 id="init">
        <p>
          WILL YOU <span>SH!T</span> WITH US? <br />
        </p>
        <button onClick={nextPage}>YES</button>
        <span id="baby">(SOUND ON!)</span>
      </h1>
    </div>
  );
}

export default LandingPage;
