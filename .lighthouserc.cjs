// Lighthouse CI configuration.
// Assertions use "error" level so the job accurately reflects budget status.
// The CI job itself is marked continue-on-error so a metric regression surfaces
// as a visible warning without ever blocking deployment.

/** @type {import('@lhci/cli').LighthouseCliFlags} */
module.exports = {
  ci: {
    collect: {
      // Server is started separately in CI before lhci runs.
      url: ["http://localhost:3000/"],
      numberOfRuns: 3,
      settings: {
        // Required when Chrome runs as root inside a container.
        // --disable-gpu and --disable-setuid-sandbox prevent DevTools protocol
        // timeout (Page.captureScreenshot) seen on GitHub-hosted runners.
        chromeFlags: "--no-sandbox --disable-dev-shm-usage --disable-gpu --disable-setuid-sandbox",
      },
    },

    assert: {
      assertions: {
        // ── Category scores ────────────────────────────────────────────────
        "categories:performance":    ["error", { minScore: 0.8 }],
        "categories:accessibility":  ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo":            ["error", { minScore: 0.8 }],

        // ── Core Web Vitals budgets ────────────────────────────────────────
        // FCP: page content must appear within 2 s
        "first-contentful-paint":  ["error", { maxNumericValue: 2000 }],
        // LCP: largest element within 3.5 s
        "largest-contentful-paint": ["error", { maxNumericValue: 3500 }],
        // TBT: main-thread blocking under 300 ms
        "total-blocking-time":      ["error", { maxNumericValue: 300 }],
        // CLS: layout must not shift (< 0.1)
        "cumulative-layout-shift":  ["error", { maxNumericValue: 0.1 }],
        // TTI: fully interactive within 4 s
        "interactive":              ["error", { maxNumericValue: 4000 }],
      },
    },

    upload: {
      // Save HTML/JSON reports as CI artifacts; no external LHCI server needed.
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
