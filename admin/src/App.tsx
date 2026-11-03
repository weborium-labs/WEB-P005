import ResponsiveAppBar from "./components/ResponsiveAppBar"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { SignIn, AdminLanding } from "./pages/page.index"
import { TokenCapture } from "./components/components.index"

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLanding />}></Route>
          <Route path="/auth/signIn" element={<SignIn />}></Route>
          <Route path="/dashboard" element={<ResponsiveAppBar />}></Route>
          <Route path="/verify-token" element={<TokenCapture />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
