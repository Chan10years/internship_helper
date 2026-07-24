# Scoring And Resume Advice

This document is the source of truth for current local rule-based scoring and resume-preparation advice.

## Current Status

已实现：

- `scoreJob(job)` returns `matchScore` and `matchReasons`.
- `resumeAdvice(job)` returns `string[]`.
- `scoreAndAdviseJob(job)` fills scoring and advice into a copied job record.
- The crawl flow scores collected jobs before merge/export.

暂不实现：

- OpenAI API calls.
- Real LLM API calls.
- API-key requirements.
- Networked scoring.
- User profile based personalization in the current local phase.

## Phase Rules

- Scoring must remain local, deterministic, rule-based, explainable, and non-networked.
- Scoring code must not access browser APIs or filesystem APIs.
- Rules should stay small enough to test independently.
- Advice must be tied to visible job text. Do not fabricate user experience.

## `scoreJob(job)` Contract

`scoreJob(job)` returns:

- `matchScore`: number from 0 to 100.
- `matchReasons`: `string[]`.

The final score is clamped to the 0 to 100 range. Every score adjustment should produce a short reason.

## Current Positive Signals

Add points when title, company, city, duration, education, description, tags, or raw text contains target signals such as:

- AIGC, AI, AI工具, 生成式, LLM, ComfyUI.
- 前端, 数据, 数据分析, 数字媒体.
- C++, C/C++, 图形学, OpenCV, Unity, Unreal, UE, 游戏开发.

Add points for short or friendly internship signals:

- 1个月, 1.5个月, 1.5-2个月, 2个月, 暑期, 短期.
- 本科, 大一, 大二, 不限.
- 实习证明.
- Preferred regions currently represented in rules: 湖南, 广东, 湖北.

## Current Negative Signals

Subtract points when visible text clearly requires:

- 研一, 研二, 硕士, 博士, 6个月以上.
- 每周 5 天 and 线下.
- 销售, 客服, 纯运营.

Missing or ambiguous fields are neutral.

## `resumeAdvice(job)` Contract

`resumeAdvice(job)` returns `string[]`.

Current advice rules:

- C++ or C/C++: highlight C++ OOP, algorithm competition, or engineering practice.
- 游戏开发, Unity, Unreal, or UE: highlight UE5, Unity, interaction projects, and scene-building experience.
- AIGC, ComfyUI, or 生成式: highlight ComfyUI, AIGC workflows, static web projects, and digital exhibition projects.
- 前端, HTML, CSS, or JavaScript: highlight HTML/CSS/JS, static sites, and Netlify deployment experience.

## Future Decisions

- Whether to add a user profile shape.
- Whether profile preferences should influence scoring.
- Whether advice is generated per job or across a selected job set.
