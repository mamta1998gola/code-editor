import type { AppProps } from "next/app";
import EditorPage from "@/pages/editor";

function MyApp({ Component, pageProps }: AppProps) {
  return <EditorPage />;
}

export default MyApp;