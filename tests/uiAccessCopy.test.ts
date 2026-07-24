import test from "node:test";
import assert from "node:assert/strict";
import { accessCopy } from "../src/server/public/accessCopy.js";

test("job access copy distinguishes visitors from authenticated users", () => {
  assert.deepEqual(accessCopy(false), {
    listAction: "登录查看",
    detailState: "登录后可见",
    detailDescription: "登录后查看完整描述、来源链接、匹配理由与简历建议。"
  });

  const authenticated = accessCopy(true);
  assert.deepEqual(authenticated, {
    listAction: "查看详情",
    detailState: "点击查看",
    detailDescription: "查看完整描述、来源链接、匹配理由与简历建议。"
  });
  assert.doesNotMatch(authenticated.detailDescription, /登录后/);
});
