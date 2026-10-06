import ResponsiveAppBar from "./components/ResponsiveAppBar"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { SignIn, AdminLanding } from "./pages/page.index"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLanding />}></Route>
          <Route path="/auth/signIn" element={<SignIn />}></Route>
          <Route path="/dashboard" element={<ResponsiveAppBar />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
