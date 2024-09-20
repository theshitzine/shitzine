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
        WILL YOU <span>SH!T</span> WITH US?
      </h1>
      <button onClick={nextPage}>YES</button>
    </div>
  );
}

export default LandingPage;
