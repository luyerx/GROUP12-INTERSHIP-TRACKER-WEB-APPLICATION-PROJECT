import assert from "node:assert/strict";
export async function testAIWorkflow({ base, student, employee, admin, superadmin, appId, other }) {
  let count = 0;
  for (const feature of ["interview-prep", "application-insights"]) {
    for (const [cookie, applicationId, expected] of [[null, appId, 401], [employee, appId, 403], [admin, appId, 403], [superadmin, appId, 403], [other, appId, 404], [student, "000000000000000000000000", 404], [student, appId, 503]]) {
      const response = await fetch(`${base}/api/ai/${feature}`, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ applicationId }) });
      assert.equal(response.status, expected, `${feature}: expected ${expected}`);
      const body = await response.json();
      assert.equal(body.success, false);
      if (expected === 503) assert.match(body.message, /not configured/);
      count++;
    }
  }
  console.log(`SUCCESS ${count} AI HTTP/session/database assertions.`);
}
