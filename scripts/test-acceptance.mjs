import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
let count = 0;
function check(value, message) { assert.ok(value, message); count++; console.log("PASS " + message); }
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(file, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const loadedModule = { exports: {} };
  function localRequire(name) {
    if (name === "next/navigation") return { useRouter: () => ({ push() {}, refresh() {} }) };
    if (name.startsWith("@/")) {
      const target = name.slice(2);
      return load(fs.existsSync(target + ".ts") ? target + ".ts" : target + ".tsx");
    }
    return require(name);
  }
  vm.runInThisContext("(function(require,module,exports){" + code + "\n})", { filename: file })(localRequire, loadedModule, loadedModule.exports);
  cache.set(file, loadedModule.exports);
  return loadedModule.exports;
}
const dates = load("lib/date.ts");
check(dates.toDateInputValue("18/09/2026") === "2026-09-18", "legacy dates normalize to input contract");
check(dates.toDateInputValue("2026-09-18") === "2026-09-18", "existing ISO date round trips unchanged");
for (const value of ["2026-02-29", "2026-02-30", "2026-13-01", "31/04/2026", "garbage", "0000-01-01"]) check(!dates.parseAppDate(value), "invalid date rejected: " + value);
check(dates.isDateInputValue("2028-02-29"), "leap day accepted");
check(!dates.isDateInputValue("20/09/2026"), "form validator requires ISO date");
check(dates.formatAppDate("2026-09-18") === "18 Sept 2026" || dates.formatAppDate("2026-09-18") === "18 Sep 2026", "date display is English");
const Form = load("components/applications/ApplicationForm.tsx").default;
for (const tracked of [true, false]) {
  const html = renderToStaticMarkup(React.createElement(Form, { mode: "edit", applicationId: "test", isSystemTracked: tracked, initialValues: { organisation: "Company", roleTitle: "Intern", deadline: "2026-09-18" } }));
  for (const id of ["organisation", "roleTitle", "location", "jobDescription", "deadline", "sourceLink"]) {
    const tag = html.match(new RegExp('<(?:input|textarea)[^>]*id="' + id + '"[^>]*>'))?.[0];
    check(tag && tag.includes('readOnly=""') === tracked, (tracked ? "tracked readonly: " : "external editable: ") + id);
  }
  check(/<input[^>]*id="deadline"[^>]*type="date"/.test(html), "application uses native date picker");
  check(!/<textarea[^>]*id="notes"[^>]*readOnly/.test(html), "personal notes remain editable");
}
// Execute the real Calendar mutation handlers with controlled API failures.
const calendarSource = fs.readFileSync("app/calendar/page.tsx", "utf8");
const ast = ts.createSourceFile("calendar.tsx", calendarSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function handlerCode(name) {
  let declaration;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) declaration = node; ts.forEachChild(node, visit); }
  visit(ast);
  assert.ok(declaration);
  return ts.transpileModule("const handler = " + declaration.initializer.getText(ast) + "; handler;", { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}
for (const operation of ["save", "delete"]) {
  for (const failure of ["network", "api", "json"]) {
    const state = { saving: false, deleting: false, formOpen: true, deleteOpen: true, error: "" };
    const context = {
      Error, isDateInputValue: dates.isDateInputValue,
      applicationId: "a", organisation: "Company", eventDate: "2026-09-20", eventType: "interview", eventTitle: "Interview", eventTime: "", eventLocation: "", eventNotes: "", formMode: "create", editingEventId: null,
      isSavingEvent: false, isDeletingEvent: false, selectedEvent: { id: "event", type: "interview" },
      setIsSavingEvent: v => { state.saving = v; }, setIsDeletingEvent: v => { state.deleting = v; },
      setEventFormError: v => { state.error = v; }, setDeleteError: v => { state.error = v; },
      setShowEventForm: v => { state.formOpen = v; }, setShowDeleteModal: v => { state.deleteOpen = v; },
      fetch: async () => { if (failure === "network") throw new Error("Network unavailable"); return { ok: false, json: async () => { if (failure === "json") throw new Error("Invalid response"); return { success: false, message: "Unable to save" }; } }; },
    };
    const handler = vm.runInNewContext(handlerCode(operation === "save" ? "handleSaveEvent" : "handleDeleteEvent"), context);
    await handler();
    check(!state.saving && !state.deleting && state.error && state.formOpen && state.deleteOpen, "calendar " + operation + " recovers from " + failure + " failure without rejecting");
  }
}
const Board = load("components/applications/ApplicationBoard.tsx").default;
const board = renderToStaticMarkup(React.createElement(Board, { applications: [{ id: "one", organisation: "Example", roleTitle: "Intern", deadline: "2026-09-18", status: "Interview" }, { id: "two", organisation: "Closed", roleTitle: "Analyst", deadline: "", status: "Rejected" }] }));
check(board.includes('href="/applications/one"') && board.includes('Interview applications'), "board links real records by current status");
check(board.includes('Rejected / Withdrawn (1)') && board.includes('href="/applications/two"'), "closed board records remain accessible");
check(!board.includes('draggable='), "board has no drag mutation controls");
const ResourceLink = load("components/resources/ResourceLink.tsx").default;
for (const url of ["", "javascript:alert(1)", "https://example.test/resources"]) {
 const html = renderToStaticMarkup(React.createElement(ResourceLink, { url, origin: "https://example.test", title: "Guide" }));
 check(html.includes('unavailable') && !html.includes('<a'), "unavailable resource does not create false navigation: " + url);
}
const resource = renderToStaticMarkup(React.createElement(ResourceLink, { url: "https://example.org/guide", origin: "https://example.test", title: "Guide" }));
check(resource.includes('target="_blank"') && resource.includes('noopener noreferrer'), "external resource opens a protected new tab");
console.log("SUCCESS " + count + " frontend assertions");
