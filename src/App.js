import React from "react";
import { Route, Routes } from "react-router-dom";

import Lobby from "./components/lobby/Lobby.component";
import Room from "./components/room/Room.component";

import "./App.css";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room" element={<Room />} />
        <Route path="/:roomId" element={<Room />} />
      </Routes>
    </>
  );
};

export default App;
