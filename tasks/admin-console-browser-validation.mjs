const browserPort = 9222;
const baseUrl = "http://127.0.0.1:3000/admin?locale=en";
const title = "Temporary console validation item";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function getPageSocket() {
  const targets = await fetch(`http://127.0.0.1:${browserPort}/json`).then(response => response.json());
  const target = targets.find(item => item.type === "page");
  if (!target?.webSocketDebuggerUrl) throw new Error("Authenticated preview browser is unavailable.");
  return target.webSocketDebuggerUrl;
}

const socket = new WebSocket(await getPageSocket());
await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
let nextId = 1;
const pending = new Map();
socket.addEventListener("message", event => { const response = JSON.parse(event.data); if (response.id && pending.has(response.id)) { pending.get(response.id).resolve(response); pending.delete(response.id); } });
const cdp = (method, params = {}) => new Promise((resolve, reject) => { const id = nextId += 1; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => { const response = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text); return response.result.result.value; };
const waitFor = async expression => { for (let attempt = 0; attempt < 40; attempt += 1) { if (await evaluate(expression)) return true; await wait(150); } return false; };
const clickText = async text => evaluate(`(() => { const el = [...document.querySelectorAll('button')].find(button => button.textContent?.trim().includes(${JSON.stringify(text)})); if (!el) return false; el.click(); return true; })()`);
const inputAt = async (index, value) => evaluate(`(() => { const input = document.querySelectorAll('.console-form-grid input, .console-form-grid textarea')[${index}]; if (!input) return false; const previous = input.value; const setter = Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; setter.call(input, ${JSON.stringify(value)}); input._valueTracker?.setValue(previous); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);

try {
  await cdp("Page.navigate", { url: baseUrl });
  if (!await waitFor("document.querySelector('.console-page') !== null")) throw new Error("Signed-in administrator console did not render.");
  if (!await clickText("New item")) throw new Error("New item control is unavailable.");
  if (!await waitFor("document.querySelector('.console-form-grid') !== null")) throw new Error("Draft editor did not open.");
  await inputAt(0, "Temporary validation");
  await inputAt(1, title);
  await inputAt(2, "This temporary draft verifies the administrator workflow and will not be published to employees.");
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
  await inputAt(4, tomorrow);
  if (!await clickText("Save draft")) throw new Error("Save draft control is unavailable.");
  if (!await waitFor("document.querySelector('.console-editor-actions')?.textContent?.includes('Preview as employee') === true")) throw new Error("Draft save did not complete.");
  if (!await clickText("Preview as employee")) throw new Error("Employee preview control is unavailable.");
  if (!await waitFor("document.querySelector('.console-preview-layer') !== null")) throw new Error("Employee preview did not open.");
  const initialLocale = await evaluate("document.documentElement.lang");
  const languageToggle = await evaluate("(() => { const el = [...document.querySelectorAll('button')].find(button => /عرض بالعربية|View in English/.test(button.textContent || '')); if (!el) return false; el.click(); return true; })()");
  if (!languageToggle) throw new Error("Employee preview language switch is unavailable.");
  if (!await waitFor(`document.documentElement.lang !== ${JSON.stringify(initialLocale)}`)) throw new Error("Employee preview language switch did not apply.");
  const toggledLocale = await evaluate("document.documentElement.lang");
  const languageRestore = await evaluate("(() => { const el = [...document.querySelectorAll('button')].find(button => /عرض بالعربية|View in English/.test(button.textContent || '')); if (!el) return false; el.click(); return true; })()");
  if (!languageRestore || !await waitFor(`document.documentElement.lang === ${JSON.stringify(initialLocale)}`)) throw new Error("Employee preview language switch did not restore.");
  await clickText("Close preview");
  if (!await waitFor(`document.querySelector('.console-table')?.textContent?.includes(${JSON.stringify(title)}) === true`)) throw new Error("Saved draft did not appear in the content list.");
  const openPublish = await evaluate(`(() => { const rows = [...document.querySelectorAll('.console-table tbody tr')]; const row = rows.reverse().find(item => item.textContent?.includes(${JSON.stringify(title)})); const el = [...(row?.querySelectorAll('button') || [])].find(button => button.textContent?.trim() === 'Publish'); if (!el) return false; el.click(); return true; })()`);
  if (!openPublish) throw new Error("Publish confirmation control is unavailable.");
  if (!await waitFor("document.querySelector('.console-confirm-layer') !== null")) throw new Error("Publish confirmation did not open.");
  const confirmationCopy = await evaluate("document.querySelector('.console-confirm-panel')?.textContent || ''");
  if (!/Section|Go live|Expires|Owner/.test(confirmationCopy)) throw new Error("Publish confirmation is missing plain-language impact details.");
  if (!await clickText("Confirm schedule")) throw new Error("Scheduled publication confirmation is unavailable.");
  if (!await waitFor("document.body.textContent?.includes('scheduled')")) throw new Error("Scheduled state did not render.");
  if (!await clickText("Unpublish")) throw new Error("Unpublish action is unavailable.");
  if (!await clickText("Archive")) throw new Error("Archive action is unavailable.");
  if (!await waitFor("document.body.textContent?.includes('archived')")) throw new Error("Archived state did not render.");
  if (!await clickText("Restore")) throw new Error("Restore action is unavailable.");
  if (!await waitFor("document.body.textContent?.includes('draft')")) throw new Error("Restored draft state did not render.");
  await clickText("Archive");
  console.log("PASS signed-in administrator console browser validation");
} finally {
  socket.close();
}
