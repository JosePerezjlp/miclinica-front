import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { onLoginThunk } from "./Login.action";

const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.login.loading);
  const token = useAppSelector((s) => s.login.token);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    dispatch(onLoginThunk(data, { onSuccess: () => navigate("/dashboard") }));
  };

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4 border border-slate-200"
      >
        <h1 className="text-2xl font-bold text-center text-slate-900">
          Iniciar sesion
        </h1>

        <input
          type="text"
          placeholder="Usuario"
          {...register("username")}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        {errors.username && (
          <p className="text-sm text-red-600">{errors.username.message}</p>
        )}

        <input
          type="password"
          placeholder="Contrasena"
          {...register("password")}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? "Cargando..." : "Entrar"}
        </button>

        <p className="text-sm text-slate-600 text-center">
          No tienes cuenta?{" "}
          <Link
            to="/register"
            className="text-slate-900 font-semibold hover:underline"
          >
            Registrate
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginContainer;
