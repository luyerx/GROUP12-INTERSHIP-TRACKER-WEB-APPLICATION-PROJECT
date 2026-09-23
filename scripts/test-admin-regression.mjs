import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
let count = 0;
const check = (value, label) => { assert.ok(value, label); count++; console.log("ADMIN PASS " + label); };
let actor = { id: "actor", role: "superadmin" };
let deleted = false;
const resource = { _id: "resource", title: "Regression resource" };
const query = value => ({ sort: () => query(value), lean: async () => value });
const models = {
  "@/lib/models/User": { UserModel: { find: () => query([{ _id: "user", fullName: "Regression User", role: "student", createdAt: new Date() }]) } },
  "@/lib/models/Resource": { ResourceModel: { findByIdAndDelete: id => { check(id === "resource", "DELETE uses the route ID"); deleted = true; return query(resource); } } },
  "@/lib/models/Opportunity": { OpportunityModel: { findByIdAndDelete: () => { throw new Error("Resource DELETE touched opportunities"); } } },
};
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(file, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = name => {
    if (name === "server-only") return {};
    if (name === "next/server") return { NextResponse: Response };
    if (name === "@/lib/auth") return { getAuthenticatedUser: async () => actor };
    if (name === "@/lib/mongodb") return { connectToDatabase: async () => {} };
    if (models[name]) return models[name];
    if (name.startsWith("@/")) return load(name.slice(2) + ".ts");
    return require(name);
  };
  vm.runInThisContext("(function(require,module,exports){" + code + "\n})", { filename: file })(localRequire, loadedModule, loadedModule.exports);
  cache.set(file, loadedModule.exports);
  return loadedModule.exports;
}
const users = load("app/api/admin/users/route.ts");
const content = load("app/api/admin/content/[id]/route.ts");
const guard = load("lib/authorization.ts");
for (const role of ["superadmin", "admin", "student", "employee", null]) {
  actor = role ? { id: "actor", role } : null;
  const expected = role === "admin" || role === "superadmin" ? 200 : role ? 403 : 401;
  const response = await users.GET();
  check(response.status === expected, role + " GET users status");
  if (expected === 200) check((await response.json()).data[0].name === "Regression User", role + " GET returns real model rows");
  deleted = false;
  const deletion = await content.DELETE(new Request("http://localhost/api/admin/content/resource?kind=resources", { method: "DELETE" }), { params: Promise.resolve({ id: "resource" }) });
  check(deletion.status === expected && deleted === (expected === 200), role + " resource delete authorization and model selection");
  check((await guard.authorizeRole("superadmin")).authorized === (role === "superadmin"), role + " Super Admin-only authorization is correct");
}

// Execute the actual client handler, including failure paths and refresh behavior.
const source = fs.readFileSync("components/admin/AdminContentTable.tsx", "utf8");
const ast = ts.createSourceFile("content.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let remove;
function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === "remove") remove = node; ts.forEachChild(node, visit); }
visit(ast);
assert.ok(remove);
const code = ts.transpileModule(remove.getText(ast) + "; remove;", { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
for (const scenario of ["success", "forbidden", "missing", "invalid-json", "network", "unsuccessful-body", "cancel"]) {
  const state = { editing: { id: "resource" }, busy: false, error: "", success: "old", refreshed: false, requested: false };
  const context = {
    editing: state.editing, busy: false, kind: "resources", confirm: () => scenario !== "cancel",
    setBusy: value => { state.busy = value; }, setError: value => { state.error = value; },
    setSuccess: value => { state.success = value; }, setEditing: value => { state.editing = value; },
    load: async () => { state.refreshed = true; },
    fetch: async (url, options) => {
      state.requested = true;
      check(url === "/api/admin/content/resource?kind=resources" && options.method === "DELETE", "client sends ID, kind and DELETE");
      if (scenario === "network") throw new Error("network");
      return { ok: scenario === "success" || scenario === "unsuccessful-body", json: async () => {
        if (scenario === "invalid-json") throw new Error("json");
        return { success: scenario === "success", message: scenario === "forbidden" ? "Permission denied" : "Content not found" };
      } };
    },
  };
  await vm.runInNewContext(code, context)();
  check(!state.busy, scenario + " releases busy state");
  if (scenario === "success") check(state.editing === null && state.refreshed && !state.error, "successful delete closes modal and refreshes list");
  else if (scenario === "cancel") check(!state.requested && state.editing && !state.refreshed, "cancel leaves resource intact");
  else check(state.editing && !state.refreshed && state.error, scenario + " retains modal and exposes error");
  if (scenario === "forbidden") check(state.error === "Permission denied", "delete preserves actual API error");
}

// Scan production TypeScript only, including future repository update calls.
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (/\.tsx?$/.test(file)) {
      const text = fs.readFileSync(file, "utf8");
      if (/find(?:One|ById)And(?:Update|Replace)/.test(text)) check(!/\bnew\s*:\s*(true|false)\b|\breturnOriginal\s*:/.test(text), file + " uses supported update return options");
    }
  }
}
scan("app"); scan("lib");
console.log("SUCCESS " + count + " admin regression assertions (controlled database boundary)");
