import ResponsiveAppBar from "./components/ResponsiveAppBar"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignIn from "./pages/SignIn"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<>hi</>}></Route>
          <Route path="/auth/signIn" element={<SignIn />}></Route>
          <Route path="/dashboard" element={<ResponsiveAppBar />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
