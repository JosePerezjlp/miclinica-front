import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";

export default function AfiliadoSearch() {
  const [dni, setDni] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = dni.replace(/\D/g, "");
    if (!normalized || normalized.length < 6) {
      setError("Ingresá un DNI válido (mínimo 6 dígitos).");
      return;
    }
    setError("");
    navigate(`/afiliado/${normalized}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center">
            Mi Credencial
          </h1>
          <p className="text-slate-500 text-sm text-center mt-1">
            Consultá tu información de afiliado ingresando tu DNI
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="dni"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Número de DNI
            </label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={(e) => {
                setDni(e.target.value);
                setError("");
              }}
              placeholder="Ej: 30123456"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300 transition"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Search className="w-4 h-4" />
            Consultar
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          La información es de carácter privado y confidencial.
        </p>
      </div>
    </div>
  );
}
