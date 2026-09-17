import { onRequest as __programm___path___js_onRequest } from "/Users/romolovelati/Desktop/fernsehheute.de/astro-fernsehheute/functions/programm/[[path]].js"

export const routes = [
    {
      routePath: "/programm/:path*",
      mountPath: "/programm",
      method: "",
      middlewares: [],
      modules: [__programm___path___js_onRequest],
    },
  ]