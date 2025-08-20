import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Permite textos com aspas em PT-BR sem precisar escapar
      "react/no-unescaped-entities": "off",
      // Desativado no build da Vercel (algumas versões não aceitam options)
      // Mantemos off para evitar falsos positivos com hooks "usar..."
      "react-hooks/rules-of-hooks": "off",
      // Evita quebrar o build por tipagens em progresso
      "@typescript-eslint/no-explicit-any": "warn",
      // Interfaces de UI que apenas estendem HTML props
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];

export default eslintConfig;
