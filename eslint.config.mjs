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
      // Aceita hooks com prefixo "usar..." além de "use..."
      "react-hooks/rules-of-hooks": [
        "error",
        { additionalHooks: "^(usar[A-Z].*)$" }
      ],
      // Evita quebrar o build por tipagens em progresso
      "@typescript-eslint/no-explicit-any": "warn",
      // Interfaces de UI que apenas estendem HTML props
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];

export default eslintConfig;
