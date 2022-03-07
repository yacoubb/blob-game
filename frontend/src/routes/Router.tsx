import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoggedInRoute from './LoggedInRoute';
import Register from '../pages/Register';
import Home from '../pages/Home';
import Lobby from '../pages/Lobby';
import Game from '../pages/Game';

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<LoggedInRoute />}>
          <Route index element={<Home />} />
          <Route path="lobby/">
            <Route index element={<Navigate to="/" />} />
            <Route path=":lobbyID" element={<Lobby />} />
          </Route>
          <Route path="game/">
            <Route index element={<Navigate to="/" />} />
            <Route path=":gameID" element={<Game />} />
          </Route>
          <Route path="create" element={<div>Create game</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
