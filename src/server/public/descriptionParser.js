const headingLabels = new Map([
  ["岗位职责", "岗位职责"],
  ["工作职责", "岗位职责"],
  ["工作内容", "岗位职责"],
  ["职位描述", "岗位职责"],
  ["你会做什么", "岗位职责"],
  ["任职要求", "任职要求"],
  ["职位要求", "任职要求"],
  ["岗位要求", "任职要求"],
  ["职责要求", "任职要求"],
  ["任职资格", "任职要求"],
  ["我们希望你", "任职要求"],
  ["优先条件", "加分项"],
  ["加分项", "加分项"],
  ["成长发展", "成长与机会"],
  ["成长与发展", "成长与机会"],
  ["工作机会", "到岗与发展"],
  ["投递要求", "投递说明"]
]);

const knownHeadings = [...headingLabels.keys()].sort((left, right) => right.length - left.length);
const headingAlternation = knownHeadings.join("|");
const headingPattern = new RegExp(
  `(?:[【\\[](${headingAlternation}|关于[^】\\]]{1,24})[】\\]]|(^|[。；;])\\s*(${headingAlternation})\\s*(?=[：:]|\\d{1,2}\\s*[、.．)]|[-–—•]))\\s*[：:]?`,
  "g"
);

function cleanItem(value) {
  return value
    .replace(/^[\s，,。；;：:、]+/, "")
    .replace(/[\s；;]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitItems(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return [];

  const numberedMarker =
    /(?:^|[\s；;])(?:\d{1,2}\s*[、.．)]|[（(]\s*\d{1,2}\s*[）)])\s*/g;
  const markers = [...text.matchAll(numberedMarker)];

  if (markers.length) {
    const items = [];
    const prefix = cleanItem(text.slice(0, markers[0].index));
    if (prefix) items.push(prefix);

    for (let index = 0; index < markers.length; index += 1) {
      const start = (markers[index].index ?? 0) + markers[index][0].length;
      const end = markers[index + 1]?.index ?? text.length;
      const item = cleanItem(text.slice(start, end));
      if (item) items.push(item);
    }
    return items;
  }

  const dashItems = text
    .split(/(?:^|\s)[-–—•]\s*/)
    .map(cleanItem)
    .filter(Boolean);
  if (dashItems.length > 1 || /^[\-–—•]/.test(text)) return dashItems;

  const semicolonItems = text
    .split(/[；;]\s*/)
    .map(cleanItem)
    .filter(Boolean);
  return semicolonItems.length > 1 ? semicolonItems : [cleanItem(text)];
}

function normalizedHeading(value) {
  const heading = value.replace(/[【】[\]\s：:]/g, "");
  if (heading.startsWith("关于")) return "岗位概览";
  return headingLabels.get(heading) ?? heading;
}

function mergeGroups(groups) {
  const merged = [];
  for (const group of groups) {
    if (!group.items.length) continue;
    const existing = merged.find((candidate) => candidate.title === group.title);
    if (existing) {
      existing.items.push(...group.items);
    } else {
      merged.push({ title: group.title, items: [...group.items] });
    }
  }
  return merged;
}

function sectionEndBeforeHeading(heading) {
  return (heading.index ?? 0) + (heading[2]?.length ?? 0);
}

export function parseJobDescription(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return [{ title: "岗位内容", items: ["暂无描述"] }];

  headingPattern.lastIndex = 0;
  const headings = [...text.matchAll(headingPattern)];
  if (!headings.length) {
    return [{ title: "岗位内容", items: splitItems(text) }];
  }

  const groups = [];
  const prefix = cleanItem(text.slice(0, sectionEndBeforeHeading(headings[0])));
  if (prefix) groups.push({ title: "岗位概览", items: splitItems(prefix) });

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const start = (heading.index ?? 0) + heading[0].length;
    const end = headings[index + 1] ? sectionEndBeforeHeading(headings[index + 1]) : text.length;
    groups.push({
      title: normalizedHeading(heading[1] || heading[3]),
      items: splitItems(text.slice(start, end))
    });
  }

  return mergeGroups(groups);
}
