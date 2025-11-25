import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  // Load the polyfill only in the browser
  if (typeof window !== "undefined") {
    import("../polyfills/buffer-bigint");
  }
  return <Component {...pageProps} />;
}
