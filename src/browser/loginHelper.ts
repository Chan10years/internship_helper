import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Page } from "playwright";

export const manualLoginPrompt =
  "请在弹出的浏览器中手动登录自己的账号。如果出现验证码，请手动完成。完成后回到终端按 Enter 继续。";

export async function waitForManualLogin(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    await rl.question(manualLoginPrompt);
  } finally {
    rl.close();
  }
}

export function shouldPauseForManualAction(bodyText: string): boolean {
  return /验证码|安全验证|身份验证|请先登录|登录后查看|登录后继续|登录以继续|请登录/.test(bodyText);
}

export async function pauseIfLoginOrCaptcha(page: Page): Promise<void> {
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  if (shouldPauseForManualAction(bodyText)) {
    await waitForManualLogin();
  }
}
