import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

test("web UI includes explicit company and tag filters", async () => {
  const html = await fs.readFile("src/server/public/index.html", "utf8");

  assert.match(html, /id="companyFilter"/);
  assert.match(html, /id="tagFilter"/);
});

test("web UI uses the approved cinematic editorial structure", async () => {
  const html = await fs.readFile("src/server/public/index.html", "utf8");

  assert.match(html, /class="hero"/);
  assert.match(html, /id="filterDrawer"/);
  assert.match(html, /id="jobList"/);
  assert.match(html, /id="jobStage"/);
  assert.match(html, /id="detailDialog"/);
  assert.match(html, />INTERNSHIP</);
  assert.doesNotMatch(html, /SUMMER 2026/);
});

test("web UI script avoids direct innerHTML assignment for job data rendering", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.doesNotMatch(script, /\.innerHTML\s*=/);
  assert.match(script, /textContent/);
});

test("web UI script includes accessible overlay and reduced-motion behavior", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /Escape/);
  assert.match(script, /aria-expanded/);
  assert.match(script, /safeHttpUrl/);
});

test("job list keeps native button semantics inside list items", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.match(script, /item\.setAttribute\("role", "listitem"\)/);
  assert.doesNotMatch(script, /button\.setAttribute\("role", "listitem"\)/);
});

test("post-hero experience uses cinematic stage and editorial detail chapters", async () => {
  const html = await fs.readFile("src/server/public/index.html", "utf8");
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.match(html, /class="job-browser-header"/);
  assert.match(script, /stage-kicker/);
  assert.match(script, /stage-index/);
  assert.match(script, /detail-cover/);
  assert.match(script, /detail-chapter/);
  assert.match(script, /--detail-image/);
});

test("job detail uses a stable reading column and compact summary rail", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");
  const styles = await fs.readFile("src/server/public/style.css", "utf8");

  assert.match(script, /detail-body/);
  assert.match(script, /detail-main/);
  assert.match(script, /detail-aside/);
  assert.match(script, /detail-source-card/);
  assert.doesNotMatch(styles, /\.detail-section:first-child\s*\{[^}]*grid-row:\s*span\s+2/s);
});

test("job detail renders categorized description groups instead of one long paragraph", async () => {
  const html = await fs.readFile("src/server/public/index.html", "utf8");
  const script = await fs.readFile("src/server/public/app.js", "utf8");
  const styles = await fs.readFile("src/server/public/style.css", "utf8");

  assert.match(html, /type="module"/);
  assert.match(script, /parseJobDescription/);
  assert.match(script, /description-groups/);
  assert.match(script, /description-items/);
  assert.match(styles, /\.description-group/);
  assert.doesNotMatch(script, /detailSection\("这份实习，会做什么？"/);
});

test("web UI has distinct loading empty filtered and error states", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.match(script, /正在读取本地岗位数据/);
  assert.match(script, /本地还没有岗位数据/);
  assert.match(script, /当前筛选没有结果/);
  assert.match(script, /岗位数据加载失败/);
  assert.match(script, /Array\.isArray/);
});

test("web UI derives source summary and labels from actual jobs", async () => {
  const script = await fs.readFile("src/server/public/app.js", "utf8");

  assert.match(script, /sourceLabel/);
  assert.match(script, /sourceSummary/);
  assert.match(script, /option\.textContent = formatter/);
  assert.doesNotMatch(script, /来自 BOSS直聘与实习僧/);
});
