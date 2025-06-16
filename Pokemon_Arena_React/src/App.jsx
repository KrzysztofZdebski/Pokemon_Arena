import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Battle from './pages/Battle'
import Pokemon from './pages/Pokemon'
import About from './pages/About'
import Login from './pages/Login'
import Account from './pages/Account'
import './App.css'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route index element={<Home />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/pokemon" element={<Pokemon />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </Router>
  )
}

export default App;