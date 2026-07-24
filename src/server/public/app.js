let jobs = [];
let filtered = [];
let selectedId = "";
let sortByScore = false;
let detailTrigger = null;
let dataLoadState = "loading";
let currentUser = null;

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const stageImages = [
  "/assets/stage-transit.jpg",
  "/assets/stage-making.jpg",
  "/assets/hero-campus-city.jpg"
];

const jobList = document.querySelector("#jobList");
const emptyState = document.querySelector("#emptyState");
const jobStage = document.querySelector("#jobStage");
const resultSummary = document.querySelector("#resultSummary");
const drawerResultSummary = document.querySelector("#drawerResultSummary");
const heroMeta = document.querySelector("#heroMeta");
const searchInput = document.querySelector("#searchInput");
const cityFilter = document.querySelector("#cityFilter");
const sourceFilter = document.querySelector("#sourceFilter");
const companyFilter = document.querySelector("#companyFilter");
const tagFilter = document.querySelector("#tagFilter");
const sortScoreButton = document.querySelector("#sortScoreButton");
const clearFiltersButton = document.querySelector("#clearFiltersButton");
const filterDrawer = document.querySelector("#filterDrawer");
const drawerBackdrop = document.querySelector("#drawerBackdrop");
const openFiltersButton = document.querySelector("#openFiltersButton");
const inlineFiltersButton = document.querySelector("#inlineFiltersButton");
const closeFiltersButton = document.querySelector("#closeFiltersButton");
const detailDialog = document.querySelector("#detailDialog");
const detailContent = document.querySelector("#detailContent");
const closeDetailButton = document.querySelector("#closeDetailButton");
const accountLink = document.querySelector("#accountLink");
const logoutButton = document.querySelector("#logoutButton");
const filterTriggers = [openFiltersButton, inlineFiltersButton];

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function clear(element) {
  element.replaceChildren();
}

function textElement(tagName, text, className = "") {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

function fillSelect(select, label, values, formatter = (value) => value) {
  clear(select);
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = label;
  select.appendChild(allOption);

  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = formatter(value);
    select.appendChild(option);
  }
}

function searchableText(job) {
  return [job.title, job.company, job.city, job.salary].join(" ").toLowerCase();
}

function scoreLabel(job) {
  return typeof job.matchScore === "number" ? String(job.matchScore) : "未评分";
}

function stableImage(job) {
  const value = job.id || `${job.title}${job.company}${job.city}`;
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return stageImages[hash % stageImages.length];
}

function sourceLabel(source) {
  if (source === "shixiseng") {
    return "实习僧";
  }
  if (source === "boss") {
    return "BOSS直聘";
  }
  return source || "来源未标注";
}

function sourceSummary(items) {
  const sources = uniqueValues(items.map((job) => job.source)).map(sourceLabel);
  return sources.length ? sources.join("、") : "来源未标注";
}

function stateCopy() {
  if (dataLoadState === "loading") {
    return "正在读取本地岗位数据。";
  }
  if (dataLoadState === "error") {
    return "岗位数据加载失败。";
  }
  if (jobs.length === 0) {
    return "本地还没有岗位数据。请先完成安全采集或导入本地数据。";
  }
  return "当前筛选没有结果。可以放宽城市、来源或关键词。";
}

function setLayerScrollLock() {
  document.body.classList.toggle("layer-open", !filterDrawer.hidden || !detailDialog.hidden);
}

function openFilters(trigger = openFiltersButton) {
  detailTrigger = trigger;
  filterDrawer.hidden = false;
  drawerBackdrop.hidden = false;
  for (const button of filterTriggers) {
    button.setAttribute("aria-expanded", "true");
  }
  setLayerScrollLock();
  requestAnimationFrame(() => {
    filterDrawer.classList.add("is-open");
    drawerBackdrop.classList.add("is-open");
    searchInput.focus();
  });
}

function closeFilters() {
  filterDrawer.classList.remove("is-open");
  drawerBackdrop.classList.remove("is-open");
  for (const button of filterTriggers) {
    button.setAttribute("aria-expanded", "false");
  }

  const finish = () => {
    filterDrawer.hidden = true;
    drawerBackdrop.hidden = true;
    setLayerScrollLock();
    detailTrigger?.focus();
  };

  if (reducedMotionQuery.matches) {
    finish();
  } else {
    window.setTimeout(finish, 360);
  }
}

function applyFilters() {
  const keyword = searchInput.value.trim().toLowerCase();
  const city = cityFilter.value;
  const source = sourceFilter.value;
  const company = companyFilter.value;
  const tag = tagFilter.value;

  filtered = jobs.filter((job) => {
    const tags = job.tags || [];
    return (
      (!keyword || searchableText(job).includes(keyword)) &&
      (!city || job.city === city) &&
      (!source || job.source === source) &&
      (!company || job.company === company) &&
      (!tag || tags.includes(tag))
    );
  });

  if (sortByScore) {
    filtered.sort((a, b) => {
      const aScore = typeof a.matchScore === "number" ? a.matchScore : -1;
      const bScore = typeof b.matchScore === "number" ? b.matchScore : -1;
      return bScore - aScore;
    });
  }

  if (!filtered.some((job) => job.id === selectedId)) {
    selectedId = filtered[0]?.id || "";
  }

  renderResults();
}

function activeFilterSummary() {
  const active = [
    cityFilter.value,
    sourceFilter.value ? sourceLabel(sourceFilter.value) : "",
    companyFilter.value,
    tagFilter.value
  ].filter(Boolean);
  if (searchInput.value.trim()) {
    active.unshift(`“${searchInput.value.trim()}”`);
  }
  return active.length ? `${active.join(" / ")} · ` : "";
}

function renderResults() {
  const summary = `${activeFilterSummary()}${filtered.length} 个结果`;
  resultSummary.textContent = summary;
  drawerResultSummary.textContent = summary;
  emptyState.hidden = filtered.length > 0;
  emptyState.textContent = stateCopy();
  clear(jobList);

  filtered.forEach((job, index) => {
    const item = document.createElement("div");
    item.className = "job-list-item";
    item.setAttribute("role", "listitem");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "job-row";
    button.setAttribute("aria-pressed", String(job.id === selectedId));

    const number = textElement("span", String(index + 1).padStart(2, "0"), "job-number");
    const main = document.createElement("span");
    main.className = "job-row-main";
    main.appendChild(textElement("strong", job.title || "(未命名岗位)"));
    main.appendChild(textElement("small", [job.company, job.city, job.salary].filter(Boolean).join(" · ")));
    const score = textElement("span", accessCopy(Boolean(currentUser)).listAction, "job-row-score");

    button.append(number, main, score);
    button.addEventListener("click", () => selectJob(job.id));
    item.appendChild(button);
    jobList.appendChild(item);
  });

  renderStage(filtered.find((job) => job.id === selectedId));
}

function selectJob(id) {
  selectedId = id;
  const controls = jobList.querySelectorAll(".job-row");
  filtered.forEach((job, index) => {
    controls[index]?.setAttribute("aria-pressed", String(job.id === selectedId));
  });
  renderStage(filtered.find((job) => job.id === selectedId));
}

function metadataItem(label, value) {
  const item = document.createElement("div");
  item.className = "stage-fact";
  item.append(textElement("span", label), textElement("strong", value || "未注明"));
  return item;
}

function renderStage(job) {
  clear(jobStage);
  if (!job) {
    jobStage.className = "job-stage is-empty";
    jobStage.appendChild(textElement("p", stateCopy(), "stage-empty-copy"));
    return;
  }

  jobStage.className = "job-stage";
  jobStage.style.setProperty("--stage-image", `url("${stableImage(job)}")`);

  const shade = document.createElement("div");
  shade.className = "stage-shade";
  const top = document.createElement("div");
  top.className = "stage-topline";

  const topLeft = document.createElement("div");
  topLeft.className = "stage-kicker";
  topLeft.append(
    textElement("span", "PUBLIC PREVIEW"),
    textElement("strong", [job.company, job.city].filter(Boolean).join(" / "))
  );

  const currentIndex = filtered.findIndex((item) => item.id === job.id) + 1;
  const stageIndex = document.createElement("div");
  stageIndex.className = "stage-index";
  stageIndex.append(
    textElement("strong", String(currentIndex).padStart(2, "0")),
    textElement("span", `/ ${String(filtered.length).padStart(2, "0")}`)
  );
  top.append(topLeft, stageIndex);

  const title = textElement("h3", job.title || "(未命名岗位)", "stage-title");
  title.id = "stageTitle";

  const copy = accessCopy(Boolean(currentUser));
  const facts = document.createElement("div");
  facts.className = "stage-facts";
  facts.append(
    metadataItem("薪资", job.salary),
    metadataItem("城市", job.city),
    metadataItem("发布", job.publishTime),
    metadataItem("详情", copy.detailState)
  );

  const footer = document.createElement("div");
  footer.className = "stage-footer";
  footer.appendChild(textElement("p", copy.detailDescription, "stage-description"));

  const detailButton = textElement("button", "查看完整岗位 ↗", "stage-detail-button");
  detailButton.type = "button";
  detailButton.addEventListener("click", () => void openDetail(job, detailButton));
  footer.appendChild(detailButton);

  jobStage.append(shade, top, title, facts, footer);
}

function appendList(parent, items, emptyText) {
  if (!items?.length) {
    parent.appendChild(textElement("p", emptyText, "detail-muted"));
    return;
  }
  const list = document.createElement("ul");
  for (const item of items) {
    list.appendChild(textElement("li", item));
  }
  parent.appendChild(list);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function descriptionSection(description) {
  const section = document.createElement("section");
  section.className = "detail-section detail-chapter";
  section.appendChild(textElement("p", "ROLE DETAILS / 01", "detail-chapter-label"));
  section.appendChild(textElement("h3", "岗位信息"));

  const groups = document.createElement("div");
  groups.className = "description-groups";

  for (const [groupIndex, group] of parseJobDescription(description).entries()) {
    const article = document.createElement("article");
    article.className = "description-group";

    const heading = document.createElement("header");
    heading.className = "description-group-heading";
    heading.append(
      textElement("span", String(groupIndex + 1).padStart(2, "0")),
      textElement("h4", group.title)
    );

    const list = document.createElement("ol");
    list.className = "description-items";
    for (const [itemIndex, item] of group.items.entries()) {
      const row = document.createElement("li");
      row.className = "description-item";
      row.append(
        textElement("span", String(itemIndex + 1).padStart(2, "0"), "description-item-index"),
        textElement("p", item)
      );
      list.appendChild(row);
    }

    article.append(heading, list);
    groups.appendChild(article);
  }

  section.appendChild(groups);
  return section;
}

function detailListSection(label, title, items, emptyText) {
  const section = document.createElement("section");
  section.className = "detail-aside-section";
  section.appendChild(textElement("p", label, "detail-aside-label"));
  section.appendChild(textElement("h3", title));
  appendList(section, items, emptyText);
  return section;
}

async function openDetail(job, trigger) {
  const originalLabel = trigger?.textContent;
  if (trigger) {
    trigger.disabled = true;
    trigger.textContent = "正在读取完整岗位...";
  }
  try {
    const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}`);
    if (response.status === 401) {
      const params = new URLSearchParams({
        mode: "login",
        returnTo: `/?job=${encodeURIComponent(job.id)}#jobs`
      });
      window.location.assign(`/auth.html?${params.toString()}`);
      return;
    }
    if (!response.ok) {
      throw new Error(response.status === 404 ? "这份岗位已经下线。" : "完整岗位暂时无法读取。");
    }
    renderDetail(await response.json(), trigger);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "完整岗位暂时无法读取。");
  } finally {
    if (trigger) {
      trigger.disabled = false;
      trigger.textContent = originalLabel;
    }
  }
}

function renderDetail(job, trigger) {
  detailTrigger = trigger;
  clear(detailContent);
  detailDialog.style.setProperty("--detail-image", `url("${stableImage(job)}")`);

  const cover = document.createElement("header");
  cover.className = "detail-cover";
  const coverShade = document.createElement("div");
  coverShade.className = "detail-cover-shade";
  const coverTop = document.createElement("div");
  coverTop.className = "detail-cover-top";
  coverTop.append(
    textElement("p", `${sourceLabel(job.source)} / ${job.city || "城市未注明"}`, "eyebrow"),
    textElement("p", scoreLabel(job) === "未评分" ? "MATCH / —" : `MATCH / ${scoreLabel(job)}`)
  );
  const coverCopy = document.createElement("div");
  coverCopy.className = "detail-cover-copy";
  const title = textElement("h2", job.title || "(未命名岗位)");
  title.id = "detailTitle";
  coverCopy.append(
    textElement("p", job.company || "公司未注明", "detail-company"),
    title,
    textElement("p", "向下读完这份岗位 ↓", "detail-scroll-cue")
  );
  cover.append(coverShade, coverTop, coverCopy);

  const story = document.createElement("div");
  story.className = "detail-story";

  const facts = document.createElement("div");
  facts.className = "detail-facts";
  facts.append(
    metadataItem("薪资", job.salary),
    metadataItem("周期", job.duration),
    metadataItem("学历", job.education),
    metadataItem("到岗", job.workDaysPerWeek),
    metadataItem("匹配", scoreLabel(job)),
    metadataItem("发布", job.publishTime)
  );

  const body = document.createElement("div");
  body.className = "detail-body";

  const main = document.createElement("main");
  main.className = "detail-main";
  main.appendChild(descriptionSection(job.description || "暂无描述"));

  const aside = document.createElement("aside");
  aside.className = "detail-aside";

  const scoreCard = document.createElement("section");
  scoreCard.className = "detail-score-card";
  scoreCard.append(
    textElement("p", "MATCH SCORE", "detail-aside-label"),
    textElement("strong", scoreLabel(job)),
    textElement("span", typeof job.matchScore === "number" ? "基于当前本地规则" : "这份岗位暂未评分")
  );
  aside.appendChild(scoreCard);
  aside.appendChild(
    detailListSection("WHY IT FITS / 02", "为什么适合你", job.matchReasons, "这份岗位还没有评分理由。")
  );
  aside.appendChild(
    detailListSection("YOUR NEXT MOVE / 03", "简历先准备什么", job.resumeAdvice, "这份岗位暂时没有额外简历建议。")
  );

  const link = job.link ? safeHttpUrl(job.link) : "";
  if (link) {
    const anchor = document.createElement("a");
    anchor.className = "detail-source-card";
    anchor.href = link;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.append(
      textElement("span", "SOURCE"),
      textElement("strong", "去原网站查看"),
      textElement("span", "↗")
    );
    aside.appendChild(anchor);
  }

  body.append(main, aside);
  story.append(facts, body);
  detailContent.append(cover, story);
  detailDialog.hidden = false;
  setLayerScrollLock();
  requestAnimationFrame(() => {
    detailDialog.classList.add("is-open");
    closeDetailButton.focus();
  });
}

function closeDetail() {
  detailDialog.classList.remove("is-open");
  const finish = () => {
    detailDialog.hidden = true;
    setLayerScrollLock();
    detailTrigger?.focus();
  };
  if (reducedMotionQuery.matches) {
    finish();
  } else {
    window.setTimeout(finish, 420);
  }
}

function clearFilters() {
  searchInput.value = "";
  cityFilter.value = "";
  sourceFilter.value = "";
  companyFilter.value = "";
  tagFilter.value = "";
  sortByScore = false;
  sortScoreButton.setAttribute("aria-pressed", "false");
  sortScoreButton.textContent = "优先看高匹配";
  applyFilters();
}

async function loadJobs() {
  dataLoadState = "loading";
  resultSummary.textContent = "正在读取本地岗位数据";
  drawerResultSummary.textContent = "正在读取本地岗位数据";
  heroMeta.textContent = "正在读取本地岗位数据";
  renderStage(undefined);

  const response = await fetch("/api/jobs");
  if (!response.ok) {
    let message = "岗位数据加载失败。请刷新页面后再试。";
    try {
      const errorPayload = await response.json();
      if (errorPayload?.message) {
        message = errorPayload.message;
      }
    } catch {
      // Keep the stable fallback message when the server response is not JSON.
    }
    throw new Error(message);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("岗位数据加载失败：接口返回格式不是数组。");
  }

  jobs = payload;
  dataLoadState = response.headers.get("X-Internship-Data-State") || (jobs.length > 0 ? "ready" : "empty");
  fillSelect(cityFilter, "全部城市", uniqueValues(jobs.map((job) => job.city)));
  fillSelect(sourceFilter, "登录后查看来源", []);
  fillSelect(companyFilter, "全部公司", uniqueValues(jobs.map((job) => job.company)));
  fillSelect(tagFilter, "登录后查看标签", []);
  heroMeta.textContent =
    jobs.length > 0
      ? `${jobs.length} 份真实岗位 / ${sourceSummary(jobs) === "来源未标注" ? "公开摘要可浏览" : `来自 ${sourceSummary(jobs)}`}`
      : "本地还没有岗位数据";
  applyFilters();

  const requestedId = new URLSearchParams(window.location.search).get("job");
  const requestedJob = jobs.find((job) => job.id === requestedId);
  if (requestedJob) {
    selectJob(requestedJob.id);
    void openDetail(requestedJob, inlineFiltersButton);
  }
}

async function loadSession() {
  const response = await fetch("/api/auth/me", { headers: { accept: "application/json" } });
  if (!response.ok) return;
  const payload = await response.json();
  currentUser = payload.user;
  accountLink.textContent = payload.user.displayName;
  accountLink.href = "#jobs";
  logoutButton.hidden = false;
  renderResults();
}

async function logout() {
  const csrfResponse = await fetch("/api/auth/csrf");
  if (!csrfResponse.ok) throw new Error("无法安全退出，请刷新后重试。");
  const { csrfToken } = await csrfResponse.json();
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "x-csrf-token": csrfToken }
  });
  if (!response.ok) throw new Error("退出失败，请稍后重试。");
  window.location.assign("/");
}

searchInput.addEventListener("input", applyFilters);
cityFilter.addEventListener("change", applyFilters);
sourceFilter.addEventListener("change", applyFilters);
companyFilter.addEventListener("change", applyFilters);
tagFilter.addEventListener("change", applyFilters);
clearFiltersButton.addEventListener("click", clearFilters);
sortScoreButton.addEventListener("click", () => {
  sortByScore = !sortByScore;
  sortScoreButton.setAttribute("aria-pressed", String(sortByScore));
  sortScoreButton.textContent = sortByScore ? "恢复默认顺序" : "优先看高匹配";
  applyFilters();
});

openFiltersButton.addEventListener("click", () => openFilters(openFiltersButton));
inlineFiltersButton.addEventListener("click", () => openFilters(inlineFiltersButton));
closeFiltersButton.addEventListener("click", closeFilters);
drawerBackdrop.addEventListener("click", closeFilters);
closeDetailButton.addEventListener("click", closeDetail);
logoutButton.addEventListener("click", () => void logout().catch((error) => window.alert(error.message)));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (!detailDialog.hidden) {
    closeDetail();
  } else if (!filterDrawer.hidden) {
    closeFilters();
  }
});

void loadSession();
loadJobs().catch((error) => {
  dataLoadState = "error";
  clear(jobList);
  clear(jobStage);
  emptyState.hidden = false;
  emptyState.textContent = `岗位数据加载失败：${error.message}`;
  resultSummary.textContent = "数据读取失败";
  drawerResultSummary.textContent = "数据读取失败";
  heroMeta.textContent = "岗位数据加载失败";
  jobStage.className = "job-stage is-empty";
  jobStage.appendChild(textElement("p", `岗位数据加载失败：${error.message}`, "stage-empty-copy"));
});
import { parseJobDescription } from "./descriptionParser.js";
import { accessCopy } from "./accessCopy.js";
