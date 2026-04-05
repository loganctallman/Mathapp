import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Math Trainer",
    short_name: "Math Trainer",
    description: "Simple math practice for addition, subtraction, multiplication, and division.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111114",
    theme_color: "#111114",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
