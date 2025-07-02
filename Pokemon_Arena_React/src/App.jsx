import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./utils/protectedRoute";
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Battle from './pages/Battle'
import Pokemon from './pages/Pokemon'
import About from './pages/About'
import Login from './pages/Login'
import Account from './pages/Account'
import Combat from './pages/Combat'
import Pokeballs from "./pages/Pokeballs";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas); // Add all solid icons to the library


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route index element={<Home />} />
        <Route path="/battle" element={<ProtectedRoute> <Battle /> </ProtectedRoute>} />
        <Route path="/battle/:id" element={<ProtectedRoute> <Combat /> </ProtectedRoute>} />
        <Route path="/pokemon" element={<ProtectedRoute> <Pokemon /> </ProtectedRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/account" element={<ProtectedRoute> <Account /> </ProtectedRoute>} />
        <Route path="/pokeballs" element={<ProtectedRoute> <Pokeballs /> </ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App;