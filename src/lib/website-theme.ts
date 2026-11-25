import { createServerFn } from "@tanstack/react-start";

export const getWebsiteTheme = createServerFn({ method: "GET" }).handler(async () => {
  const { getCmsData } = await import("./cms-store");
  return (await getCmsData()).site.theme === "light" ? "light" : "dark";
});
