import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SetupScreen from './screens/SetupScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen from './screens/ResultsScreen';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0f0d1a]">
        <Routes>
          <Route path="/" element={<SetupScreen />} />
          <Route path="/game/:gameId" element={<GameScreen />} />
          <Route path="/results/:gameId" element={<ResultsScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
