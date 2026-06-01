declare module "react-syntax-highlighter/dist/esm/light" {
  import { ComponentType } from "react";
  const Prism: ComponentType<Record<string, unknown>> & {
    registerLanguage: (name: string, lang: unknown) => void;
  };
  export default Prism;
}

declare module "react-syntax-highlighter/dist/esm/languages/prism/*" {
  const lang: { name: string; [key: string]: unknown };
  export default lang;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const oneDark: Record<string, React.CSSProperties>;
}
