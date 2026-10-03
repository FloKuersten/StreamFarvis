const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:5175";
const outputDir = path.resolve("artifacts/ui-smoke");
const viewports = [
  { width: 393, height: 852 },
  { width: 360, height: 800 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
];

// Fictional catalog and synthetic artwork: no TMDB account or token is used.
// The TV id deliberately exercises a show with upstream episode-group mapping.
const movie = {
  id: 900001, media_type: "movie", title: "Fixture Movie",
  release_date: "2020-01-01", original_language: "en", genre_ids: [], genres: [],
  overview: "A fictional adventure beneath a distant sky. This catalog entry exists only to test the Android interface.",
  vote_average: 7.8, runtime: 108,
  poster_path: "/fixture-movie-0.svg", backdrop_path: "/fixture-movie-backdrop.svg",
};
const tv = {
  id: 71446, media_type: "tv", name: "Fixture TV", first_air_date: "2020-01-01",
  original_language: "en", genre_ids: [], genres: [], origin_country: ["US"],
  overview: "A fictional series about the city beyond the horizon. Explore two seasons of test episodes.",
  vote_average: 8.2, number_of_seasons: 2, number_of_episodes: 2, status: "Ended",
  seasons: [{ season_number: 1, episode_count: 1 }, { season_number: 2, episode_count: 1 }],
  poster_path: "/fixture-tv-0.svg", backdrop_path: "/fixture-tv-backdrop.svg",
};
const movies = [movie, ...[1, 2, 3].map(index => ({ ...movie, id: movie.id + index, title: `Fixture Film ${index}`, poster_path: `/fixture-movie-${index}.svg` }))];
const series = [tv, ...[1, 2, 3].map(index => ({ ...tv, id: 900010 + index, name: `Fixture Series ${index}`, poster_path: `/fixture-tv-${index}.svg` }))];
const trailers = { results: [{ type: "Trailer", site: "YouTube", key: "fixture-trailer" }] };

function fixtureResponse(requestPath) {
  if (requestPath === "/3/configuration") return {};
  if (["/3/trending/movie/week", "/3/movie/top_rated"].includes(requestPath)) return { results: movies };
  if (["/3/trending/tv/week", "/3/tv/top_rated"].includes(requestPath)) return { results: series };
  if (requestPath === "/3/search/multi") return { results: [movie, tv] };
  if (requestPath === "/3/movie/900001") return movie;
  if (requestPath === "/3/tv/71446") return tv;
  if (requestPath.endsWith("/videos")) return trailers;
  const match = requestPath.match(/^\/3\/tv\/71446\/season\/(\d+)$/);
  if (match) {
    const season = Number(match[1]);
    return {
      id: 100 + season, season_number: season,
      episodes: [{ id: 1000 + season, season_number: season, episode_number: 1,
        name: `Fixture S${season}E1`, overview: "A fictional episode for interface testing.",
        air_date: "2020-01-01", still_path: "/fixture-tv-backdrop.svg" }],
    };
  }
  return { results: [] };
}

function fixtureArtwork(requestPath) {
  const isTV = requestPath.includes("fixture-tv");
  const variant = Number(requestPath.match(/-(\d+)\.svg$/)?.[1] || 0);
  const backdrop = requestPath.includes("backdrop");
  const hue = (isTV ? 188 : 268) + variant * 23;
  const width = backdrop ? 1600 : 600;
  const height = backdrop ? 900 : 900;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="sky" x2=".8" y2="1"><stop stop-color="hsl(${hue},55%,40%)"/><stop offset="1" stop-color="#090d1c"/></linearGradient><radialGradient id="sun"><stop stop-color="#f5c7b8"/><stop offset="1" stop-color="#e78a95"/></radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#sky)"/><circle cx="${width * .68}" cy="${height * .27}" r="${backdrop ? 130 : 116}" fill="url(#sun)" opacity=".9"/>
    <path d="M0 630 L${width * .27} 340 L${width * .5} 570 L${width * .7} 430 L${width} 670 V900 H0Z" fill="#10162a"/>
    <path d="M0 710 L${width * .2} 530 L${width * .46} 680 L${width * .84} 570 L${width} 730 V900 H0Z" fill="#070b16"/>
    <text x="40" y="${backdrop ? 80 : 765}" fill="white" font-size="${backdrop ? 28 : 48}" font-family="sans-serif" font-weight="700" letter-spacing="3">${isTV ? "FIXTURE SERIES" : "FIXTURE FILM"}</text>
    <text x="40" y="${backdrop ? 115 : 807}" fill="#c8c8d8" font-size="${backdrop ? 18 : 20}" font-family="sans-serif" letter-spacing="4">SYNTHETIC TEST ARTWORK</text>
  </svg>`;
}

async function checkOverflow(page, stage) {
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
    panels: [...document.querySelectorAll(".main,.apikey-box,.search-box,.android-settings,.android-license-dialog,.detail-content,.android-player")].map(el => ({
      name: el.className, width: el.clientWidth, content: el.scrollWidth,
      left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right,
    })),
  }));
  assert.ok(metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1, `${stage}: page overflow ${JSON.stringify(metrics)}`);
  for (const panel of metrics.panels) {
    assert.ok(panel.content <= panel.width + 1, `${stage}: panel overflow ${JSON.stringify(panel)}`);
    assert.ok(panel.left >= -1 && panel.right <= metrics.viewport + 1, `${stage}: clipped panel ${JSON.stringify(panel)}`);
  }
  return metrics;
}

async function back(page) {
  assert.equal(await page.evaluate(() => window.dispatchEvent(new CustomEvent("streamfarvis:back", { cancelable: true }))), false);
}

async function screenshot(page, name, viewport) {
  await page.screenshot({ path: path.join(outputDir, `${name}-${viewport.width}x${viewport.height}.png`), animations: "disabled" });
}

async function testViewport(browser, viewport) {
  const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const runtimeErrors = [], requests = [], checks = [], layouts = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.route("https://api.themoviedb.org/3/**", async route => {
    const requestPath = new URL(route.request().url()).pathname;
    requests.push(requestPath);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixtureResponse(requestPath)) });
  });
  await page.route("https://image.tmdb.org/**", route => route.fulfill({ status: 200, contentType: "image/svg+xml", body: fixtureArtwork(new URL(route.request().url()).pathname) }));
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByLabel("TMDB Read Access Token").waitFor();
    layouts.push({ stage: "setup", ...await checkOverflow(page, "setup") });
    await screenshot(page, "setup", viewport);
    await page.getByLabel("TMDB Read Access Token").fill("fixture-token");
    await page.getByRole("button", { name: "Let's go" }).click();
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await navigation.waitFor();
    assert.equal(await navigation.getByRole("button").count(), 4);
    await page.getByText("Trending Movies", { exact: true }).waitFor();
    await page.getByText("Trending Series", { exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
    layouts.push({ stage: "home", ...await checkOverflow(page, "home") });
    await screenshot(page, "fixture-home", viewport);

    const filters = page.getByRole("group", { name: "Catalog type" });
    await filters.getByRole("button", { name: "Series", exact: true }).click();
    assert.equal(await filters.getByRole("button", { name: "Series", exact: true }).getAttribute("aria-pressed"), "true");
    await page.locator(".hero-title").filter({ hasText: "Fixture TV" }).waitFor();
    assert.equal(await page.getByText("Trending Movies", { exact: true }).count(), 0);
    await page.getByText("Trending Series", { exact: true }).waitFor();
    assert.ok((await page.locator(".android-poster-rail .card-title").allTextContents()).every(title => title === "Fixture TV" || title.startsWith("Fixture Series")));
    await filters.getByRole("button", { name: "Movies", exact: true }).click();
    await page.locator(".hero-title").filter({ hasText: "Fixture Movie" }).waitFor();
    assert.equal(await page.getByText("Trending Series", { exact: true }).count(), 0);
    assert.ok((await page.locator(".android-poster-rail .card-title").allTextContents()).every(title => title === "Fixture Movie" || title.startsWith("Fixture Film")));
    await filters.getByRole("button", { name: "For you", exact: true }).click();
    await page.getByText("Trending Series", { exact: true }).waitFor();
    checks.push("catalog filters update hero and poster rails by media type");

    // The main hero action must navigate to its movie details.
    await page.getByRole("button", { name: "Watch now", exact: true }).click();
    await page.locator(".detail-title").filter({ hasText: "Fixture Movie" }).waitFor();
    await page.waitForLoadState("networkidle");
    layouts.push({ stage: "movie", ...await checkOverflow(page, "movie") });
    await screenshot(page, "fixture-movie", viewport);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    const player = page.getByRole("region", { name: "Android player" });
    await player.waitFor();
    assert.equal(await page.locator("webview").count(), 0);
    assert.deepEqual(await page.getByLabel("Playback source").locator("option").allTextContents(), ["Videasy", "VidSrc", "Vidking"]);
    await page.getByLabel("Playback source").selectOption("videasy");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("streambert_androidPlayerSource"))), "videasy");
    await player.getByRole("button", { name: "Open player", exact: true }).click();
    await player.getByRole("alert").filter({ hasText: "Install the Android APK" }).waitFor();
    await player.getByRole("button", { name: "Retry player", exact: true }).waitFor();
    checks.push("browser player reports APK requirement and preserves source selection");
    layouts.push({ stage: "movie-player", ...await checkOverflow(page, "movie-player") });
    await page.getByRole("button", { name: "Trailer", exact: true }).click();
    await page.getByRole("dialog", { name: "Fixture Movie trailer" }).waitFor();
    await back(page);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await player.waitFor();
    await page.locator(".detail-title").filter({ hasText: "Fixture Movie" }).waitFor();
    checks.push("movie Back closes trailer while preserving selected player");
    await back(page);
    await player.waitFor({ state: "hidden" });
    await page.locator(".detail-title").filter({ hasText: "Fixture Movie" }).waitFor();
    await back(page);
    await page.locator(".detail-title").waitFor({ state: "hidden" });
    checks.push("movie Back closes player before navigating away");

    await navigation.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByPlaceholder("Search movies and series...").fill("Fixture");
    await page.locator(".search-result").filter({ hasText: "Fixture TV" }).click();
    await page.locator(".detail-title").filter({ hasText: "Fixture TV" }).waitFor();
    await page.locator(".episode-card").filter({ hasText: "Fixture S1E1" }).waitFor();
    await page.waitForLoadState("networkidle");
    layouts.push({ stage: "tv", ...await checkOverflow(page, "tv") });
    await screenshot(page, "fixture-tv", viewport);
    await page.locator(".episode-card").filter({ hasText: "Fixture S1E1" }).click();
    await player.waitFor();
    assert.equal(await page.getByLabel("Playback source").inputValue(), "videasy");
    await page.getByRole("button", { name: "Season 2", exact: true }).click();
    await page.locator(".episode-card").filter({ hasText: "Fixture S2E1" }).click();
    await player.getByText("Season 2 · Episode 1 · Fixture S2E1", { exact: true }).waitFor();
    assert.equal(requests.some(requestPath => requestPath.includes("/episode_group/")), false);
    await page.getByRole("button", { name: "50%", exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("streambert_progress")).tv_71446_s2e1), 50);
    checks.push("mapped TV show uses TMDB seasons and persists manual episode progress");
    layouts.push({ stage: "tv-player", ...await checkOverflow(page, "tv-player") });
    await screenshot(page, "fixture-tv-player", viewport);
    await page.getByRole("button", { name: "Trailer", exact: true }).click();
    await page.getByRole("dialog", { name: "Fixture TV trailer" }).waitFor();
    await back(page);
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await player.waitFor();
    await back(page);
    await player.waitFor({ state: "hidden" });
    await page.locator(".detail-title").filter({ hasText: "Fixture TV" }).waitFor();
    await back(page);
    await page.locator(".detail-title").waitFor({ state: "hidden" });
    checks.push("TV Back closes trailer then selected player before navigating away");
    assert.deepEqual(runtimeErrors, [], `Runtime errors at ${viewport.width}px`);
    return { viewport, checks, layouts, requests, runtimeErrors };
  } catch (error) {
    await screenshot(page, "failure", viewport).catch(() => {});
    throw error;
  } finally { await context.close(); }
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const reports = [];
  try {
    for (const viewport of viewports) {
      const report = await testViewport(browser, viewport);
      reports.push(report);
      console.log(`${viewport.width}x${viewport.height}: ${report.checks.length} workflow checks passed; no overflow or runtime errors`);
    }
  } finally {
    fs.writeFileSync(path.join(outputDir, "playback-results.json"), JSON.stringify({ fixtureData: true, reports }, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
