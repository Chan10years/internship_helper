import type { InternshipJob } from "../types.js";

function textFor(job: InternshipJob): string {
  return [job.title, job.description, job.tags.join(" "), job.rawText].join(" ");
}

export function resumeAdvice(job: InternshipJob): string[] {
  const text = textFor(job);
  const advice: string[] = [];

  if (text.includes("C++") || text.includes("C/C++")) {
    advice.push("突出 C++ OOP 项目、算法竞赛或工程实践经历。");
  }
  if (text.includes("游戏开发") || text.includes("Unity") || text.includes("Unreal") || text.includes("UE")) {
    advice.push("突出 UE5、Unity、交互项目和场景搭建经验。");
  }
  if (text.includes("AIGC") || text.includes("ComfyUI") || text.includes("生成式")) {
    advice.push("突出 ComfyUI、AIGC 工作流、静态网页和数字展陈项目。");
  }
  if (text.includes("前端") || text.includes("HTML") || text.includes("CSS") || text.includes("JavaScript")) {
    advice.push("突出 HTML/CSS/JS、静态站点和 Netlify 部署经验。");
  }

  return advice;
}
