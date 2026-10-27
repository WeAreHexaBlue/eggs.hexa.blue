import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [
        tailwindcss(),
        sveltekit({
            // Root-relative links keep localized URLs unambiguous.
            paths: { relative: false },

            compilerOptions: {
                // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
                runes: ({ filename }) =>
                    filename.split(/[/\\]/).includes("node_modules") ? undefined : true
            },
            adapter: adapter(),
            typescript: {
                config: (config) => {
                    config.include.push("../drizzle.config.ts");
                }
            }
        }),

        paraglideVitePlugin({
            project: "./project.inlang",
            outdir: "./src/lib/paraglide",
            emitTsDeclarations: true,
            strategy: ["url", "baseLocale"],
            trailingSlash: "never"
        })
    ],
    server: {
        allowedHosts: [".hexa.blue"]
    }
});
