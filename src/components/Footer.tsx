import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
      &copy; {new Date().getFullYear()} MiClinica. Todos los derechos
      reservados.
    </footer>
  );
};

export default Footer;
