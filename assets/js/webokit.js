import { detectBrowserEnvironment } from "../../src/core/firmware.js";

const $ = (id) => document.getElementById(id);
const logLines = [];
function log(message, level = "info") {
  const time = new Date().toLocaleTimeString([], { hour12: false });
  const prefix = level === "error" ? "[-]" : level === "warn" ? "[!]" : "[+]";
  logLines.push(`[${time}] ${prefix} ${message}`);
  if (logLines.length > 80) logLines.shift();
  $("session-log").textContent = logLines.join("\n");
  $("log-count").textContent = `${String(logLines.length).padStart(2, "0")} EVENTS`;
  $("session-log").scrollTop = $("session-log").scrollHeight;
}

function setCard(name, value, detail, state = "neutral") {
  $(`${name}-value`).textContent = value;
  $(`${name}-detail`).textContent = detail;
  const symbol = $(`${name}-symbol`);
  symbol.className = `status-symbol ${state}`;
}

function checklist(items) {
  $("check-list").replaceChildren(...items.map(([state, label]) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = `check-dot ${state}`;
    const text = document.createElement("span");
    text.textContent = label;
    li.append(dot, text);
    return li;
  }));
}

async function exists(path) {
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function refresh() {
  log("Refreshing environment checks…");
  const env = detectBrowserEnvironment(navigator.userAgent);
  const isPS5 = env.isPS5;
  const engineAvailable = await exists("engine/wobkot/index.html");
  const mainAvailable = await exists("engine/wobkot/src/main.js");
  const kernelAvailable = await exists("engine/wobkot/src/kernel.js");
  const kexpAvailable = await exists("engine/wobkot/src/ps5/kexp.bin");
  const elfldrAvailable = await exists("engine/wobkot/src/ps5/elfldr.elf");
  const engineReady = engineAvailable && mainAvailable && kernelAvailable;

  setCard("platform", env.isPlayStation ? `PlayStation ${env.console}` : "Unknown device",
    env.isPlayStation ? "PlayStation browser user-agent detected" : "Open this page in the target console browser",
    env.isPlayStation ? "good" : "warn");
  setCard("firmware", env.version || "Not detected",
    env.version ? "Reported by browser user-agent · not verified" : "No PlayStation firmware string found",
    env.version ? "good" : "warn");
  setCard("engine", engineReady ? "Wobkot ready" : "Not installed",
    engineReady ? "Pinned upstream files are reachable" : "Initialize Git submodules before launch",
    engineReady ? "good" : "bad");
  const payloadsReady = kexpAvailable && elfldrAvailable;
  setCard("payload", payloadsReady ? "Files found" : "Missing files",
    `kexp.bin: ${kexpAvailable ? "found" : "missing"} · elfldr.elf: ${elfldrAvailable ? "found" : "missing"}`,
    payloadsReady ? "good" : "warn");

  const launch = $("launch-engine");
  launch.setAttribute("aria-disabled", String(!engineReady));
  launch.classList.toggle("is-disabled", !engineReady);
  launch.href = engineReady ? "engine/wobkot/index.html" : "#";
  launch.tabIndex = engineReady ? 0 : -1;

  const notes = [];
  notes.push(engineReady ? "Wobkot source is available." : "Wobkot submodule is missing; run git submodule update --init --recursive.");
  if (!isPS5) notes.push("Not running in a detected PS5 browser; use desktop mode for setup only.");
  if (isPS5 && env.version) notes.push(`PS5 browser reports firmware ${env.version}; compatibility is not inferred.`);
  if (!payloadsReady) notes.push("Required PS5 payload files are not both present.");
  $("launch-note").textContent = notes.join(" ");
  checklist([
    [isPS5 ? "good" : "warn", isPS5 ? "PlayStation 5 browser detected" : "PS5 browser not detected"],
    [engineReady ? "good" : "bad", engineReady ? "Wobkot engine files available" : "Wobkot submodule initialized"],
    [payloadsReady ? "good" : "warn", payloadsReady ? "Both PS5 payload files found" : "Add matching kexp.bin and elfldr.elf locally"],
    ["warn", "Verify exact firmware, payload provenance, and upstream compatibility manually"],
  ]);
  log(`Platform: ${env.isPlayStation ? `PS${env.console}` : "unknown"}; firmware: ${env.version || "unknown"}.`);
  log(`Engine: ${engineReady ? "available" : "missing"}; PS5 payloads: ${payloadsReady ? "present" : "incomplete"}.`);
  if (isPS5 && engineReady && payloadsReady) log("Preflight files are present. This is not proof of exploit compatibility.", "warn");
}

$("launch-engine").addEventListener("click", (event) => {
  if ($("launch-engine").getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    log("Cannot launch: Wobkot submodule is not available.", "error");
    return;
  }
  log("Opening upstream Wobkot engine. No automatic retry is configured.");
});
$("refresh-checks").addEventListener("click", refresh);
$("clear-log").addEventListener("click", () => {
  logLines.length = 0;
  $("session-log").textContent = "";
  $("log-count").textContent = "00 EVENTS";
  log("Log cleared.");
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then(
      () => log("Offline shell caching is available."),
      (error) => log(`Offline cache unavailable: ${error.message}`, "warn"),
    );
  });
}
refresh().catch((error) => log(`Preflight failed: ${error.message}`, "error"));
