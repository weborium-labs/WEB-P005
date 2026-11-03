/* eslint-disable @typescript-eslint/no-unused-vars */
import { CircularProgress } from "@mui/material";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../../store/auth.store";

const TokenCapture = () => {

  const setToken = useAuth((s) => s.setAccessToken)
  const setAuth = useAuth((s) => s.setAuthState);
  const setAuthChecked = useAuth((s) => s.setIsAuthChecked);

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  useEffect(() => {

    if (!token) return;

    if (token) {
      setToken(token);
      setAuth(true)

      setTimeout(() => {
        setAuthChecked(true)
        navigate('/dashboard');
      }, 0)
    }

  }, [token]);

  return (
    <div className="flex h-screen items-center place-content-center text-xl gap-5">
      <CircularProgress aria-label="Loading…" />
      Welcome Dr. Davinder Paul Singh
    </div>
  )
}

export default TokenCapture
