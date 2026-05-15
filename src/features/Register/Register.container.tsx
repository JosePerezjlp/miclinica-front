import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { onRegisterThunk } from "./Register.action";

const registerSchema = z
  .object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    password: z
      .string()
      .min(6, "La contrasena debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirma tu contrasena"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contrasenas no coinciden",
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((s) => s.register.loading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    dispatch(
      onRegisterThunk({
        nombre: data.nombre,
        username: data.username,
        password: data.password,
      }),
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4 border border-slate-200"
      >
        <h1 className="text-2xl font-bold text-center text-slate-900">
          Crear cuenta
        </h1>

        <input
          type="text"
          placeholder="Nombre"
          {...register("nombre")}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        {errors.nombre && (
          <p className="text-sm text-red-600">{errors.nombre.message}</p>
        )}

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

        <input
          type="password"
          placeholder="Confirmar contrasena"
          {...register("confirmPassword")}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <p className="text-sm text-slate-600 text-center">
          Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="text-slate-900 font-semibold hover:underline"
          >
            Inicia sesion
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterContainer;
