import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import GraphsPage from "./pages/GraphsPage";

function App() {

  const [currentPage, setCurrentPage] = useState<"home" | "graphs">("home");

  return (
    <div className="container">
      {/* Navigation */}
      <nav className="nav-bar">
        <button
          className={currentPage === "home" ? "active" : ""}
          onClick={() => setCurrentPage("home")}
        >
          Home
        </button>
        <button
          className={currentPage === "graphs" ? "active" : ""}
          onClick={() => setCurrentPage("graphs")}
        >
          Graphs
        </button>
      </nav>

      {/* Page Content */}
      <main className="content">
        {currentPage === "home" && <HomePage />}
        {currentPage === "graphs" && <GraphsPage />}
      </main>
    </div>
  );
}

export default App;
