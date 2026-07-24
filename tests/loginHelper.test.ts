import test from "node:test";
import assert from "node:assert/strict";
import { shouldPauseForManualAction } from "../src/browser/loginHelper.js";

test("shouldPauseForManualAction ignores ordinary listing navigation login text", () => {
  assert.equal(shouldPauseForManualAction("实习岗位列表 登录 注册 AIGC 实习 投递"), false);
});

test("shouldPauseForManualAction pauses for captcha and forced login states", () => {
  assert.equal(shouldPauseForManualAction("安全验证 请完成验证码"), true);
  assert.equal(shouldPauseForManualAction("请先登录后继续访问"), true);
  assert.equal(shouldPauseForManualAction("登录后查看职位详情"), true);
});
