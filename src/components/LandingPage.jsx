function LandingPage({ nextPage }) {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Welcome to Our Website</h1>
      <button onClick={nextPage}>Start</button>
    </div>
  );
}

export default LandingPage;
