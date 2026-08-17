import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const browserPort = 9227;
const profileDirectory = mkdtempSync(join(tmpdir(), "arabtec-keyboard-"));
const chromium = spawn("/usr/bin/chromium", [
  "--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${browserPort}`,
  `--user-data-dir=${profileDirectory}`, "http://127.0.0.1:3000/",
], { stdio: "ignore" });
const chromiumStopped = new Promise(resolve => chromium.once("exit", resolve));

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function waitForTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${browserPort}/json`).then(response => response.json());
      const target = targets.find(item => item.type === "page");
      if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    } catch { /* Chromium is still starting. */ }
    await wait(150);
  }
  throw new Error("Chromium did not expose a debugging target.");
}

async function run() {
  const websocketUrl = await waitForTarget();
  const socket = new WebSocket(websocketUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", event => { const response = JSON.parse(event.data); if (response.id && pending.has(response.id)) { pending.get(response.id).resolve(response); pending.delete(response.id); } });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = nextId += 1; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => {
    const response = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text);
    return response.result.result.value;
  };
  const press = async (key, code, keyCode) => { const text = key === " " ? " " : key === "Enter" ? "\r" : undefined; await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, text, unmodifiedText: text, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }); if (text) await cdp("Input.dispatchKeyEvent", { type: "char", text, unmodifiedText: text, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode }); await wait(120); };
  const waitFor = async expression => { for (let attempt = 0; attempt < 20; attempt += 1) { if (await evaluate(expression)) return true; await wait(100); } return false; };
  try {
    await wait(750);
    await evaluate("document.querySelector('.dashboard-icon-button')?.focus()");
    const searchFocus = await evaluate("(() => { const el = document.activeElement; const style = getComputedStyle(el); return { className: el.className, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }; })()");
    await press("Enter", "Enter", 13);
    const searchOpened = await waitFor("Boolean(document.querySelector('.dashboard-search'))");
    await evaluate("document.querySelector('.dashboard-search input')?.focus()");
    await cdp("Input.insertText", { text: "policy" });
    await press("Enter", "Enter", 13);
    const searchSubmitted = await waitFor("document.querySelector('#workspace-search-results')?.textContent?.includes('policy') === true");

    await evaluate("document.querySelector('.dashboard-language-switch')?.focus()");
    const languageFocus = await evaluate("(() => { const el = document.activeElement; const style = getComputedStyle(el); return { className: el.className, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }; })()");
    await press("Enter", "Enter", 13);
    const switchedToArabic = await waitFor("document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar'");
    await press("Enter", "Enter", 13);
    const switchedBackToEnglish = await waitFor("document.documentElement.dir === 'ltr' && document.documentElement.lang === 'en'");

    await evaluate("(() => { const probe = document.createElement('details'); probe.className = 'dash-card-details'; probe.innerHTML = '<summary>Keyboard detail validation</summary><p>Accessible detail content</p>'; document.body.append(probe); probe.querySelector('summary').focus(); })()");
    const detailFocus = await evaluate("(() => { const el = document.querySelector('.dash-card-details summary'); const style = getComputedStyle(el); return { focused: document.activeElement === el, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }; })()");
    await press(" ", "Space", 32);
    const detailOpened = await waitFor("document.querySelector('.dash-card-details')?.open === true");

    const result = { searchFocus, searchOpened, searchSubmitted, languageFocus, switchedToArabic, switchedBackToEnglish, detailFocus, detailOpened };
    const validFocus = focus => focus.outlineStyle !== "none" && focus.outlineWidth !== "0px";
    if (!validFocus(searchFocus) || !searchOpened || !searchSubmitted || !validFocus(languageFocus) || !switchedToArabic || !switchedBackToEnglish || !detailFocus.focused || !validFocus(detailFocus) || !detailOpened) throw new Error(`Keyboard validation failed: ${JSON.stringify(result)}`);
    console.log(`PASS browser keyboard validation: ${JSON.stringify(result)}`);
  } finally {
    socket.close();
  }
}

try { await run(); } finally { chromium.kill("SIGTERM"); await chromiumStopped; await wait(100); rmSync(profileDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); }
