import test from "node:test";
import assert from "node:assert/strict";
import { parseJobDescription } from "../src/server/public/descriptionParser.js";

test("job description parser separates headings and numbered items", () => {
  const groups = parseJobDescription(
    "岗位职责：1、负责内容策划；2、完成视频剪辑。任职要求：1、大专及以上学历；2、熟悉剪映。"
  );

  assert.deepEqual(groups, [
    { title: "岗位职责", items: ["负责内容策划", "完成视频剪辑。"] },
    { title: "任职要求", items: ["大专及以上学历", "熟悉剪映。"] }
  ]);
});

test("job description parser supports bracket headings and dash bullets", () => {
  const groups = parseJobDescription(
    "【你会做什么】 - 参与真实项目 - 整理案例库 【我们希望你】 - 保持好奇心 - 能稳定实习"
  );

  assert.deepEqual(groups, [
    { title: "岗位职责", items: ["参与真实项目", "整理案例库"] },
    { title: "任职要求", items: ["保持好奇心", "能稳定实习"] }
  ]);
});

test("job description parser does not treat heading words inside prose as a section", () => {
  const groups = parseJobDescription(
    "你现在不一定要很厉害，但我们希望你愿意变厉害。【你会做什么】1.参与真实项目。【我们希望你】1.保持好奇心。"
  );

  assert.deepEqual(groups.map((group) => group.title), ["岗位概览", "岗位职责", "任职要求"]);
  assert.equal(groups[0].items[0], "你现在不一定要很厉害，但我们希望你愿意变厉害。");
});
