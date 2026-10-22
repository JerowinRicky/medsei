import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/UI";
import { Activity, ShieldCheck } from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@amvionhealth.org");
  const [password, setPassword] = useState("Admin@123456");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Authentication failed. Check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm border border-[#E5E5E5] p-8 rounded bg-[#FFFFFF]">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-black" />
          <h1 className="text-base font-bold tracking-tight text-black">MEDSEI</h1>
          <span className="text-[10px] text-[#666666] font-mono border border-[#E5E5E5] px-1 rounded ml-auto">
            CLINICAL ENTERPRISE
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-black">Sign in to Hospital Portal</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            HMS-Integrated Clinical Discharge Platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded text-xs text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#333333] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-8 px-2.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-black bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#333333] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-8 px-2.5 text-xs border border-[#E5E5E5] rounded focus:outline-none focus:border-black bg-white"
              required
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E5E5E5] text-[11px] text-[#777777] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#111111]" /> Encrypted Session
          </span>
          <span>Role-Based Isolation</span>
        </div>
      </div>
    </div>
  );
};

