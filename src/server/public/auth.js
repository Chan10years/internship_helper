const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const resetForm = document.querySelector("#resetForm");
const loginTab = document.querySelector("#loginTab");
const registerTab = document.querySelector("#registerTab");
const formStatus = document.querySelector("#formStatus");
const query = new URLSearchParams(window.location.search);

function safeReturnPath(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.origin === window.location.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : "/";
  } catch {
    return "/";
  }
}

function setMode(mode) {
  const registering = mode === "register";
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  loginTab.setAttribute("aria-selected", String(!registering));
  registerTab.setAttribute("aria-selected", String(registering));
  formStatus.textContent = "";
  (registering ? registerForm : loginForm).querySelector("input")?.focus();
}

async function csrfToken() {
  const response = await fetch("/api/auth/csrf", { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error("暂时无法建立安全会话，请刷新后重试。");
  }
  const payload = await response.json();
  return payload.csrfToken;
}

async function submitJson(url, body) {
  const token = await csrfToken();
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": token },
    body: JSON.stringify(body)
  });
  const payload = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "操作没有完成，请稍后重试。");
  }
  return payload;
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function handleAccountSubmit(form, endpoint) {
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  formStatus.classList.remove("is-success");
  formStatus.textContent = "正在安全验证...";
  try {
    const returnTo = safeReturnPath(query.get("returnTo"));
    const result = await submitJson(endpoint, { ...formValues(form), returnTo });
    formStatus.classList.add("is-success");
    formStatus.textContent = "验证成功，正在返回岗位...";
    window.location.assign(safeReturnPath(result.returnTo));
  } catch (error) {
    formStatus.textContent = error instanceof Error ? error.message : "操作没有完成，请稍后重试。";
  } finally {
    button.disabled = false;
  }
}

loginTab?.addEventListener("click", () => setMode("login"));
registerTab?.addEventListener("click", () => setMode("register"));
loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (loginForm.reportValidity()) void handleAccountSubmit(loginForm, "/api/auth/login");
});
registerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (registerForm.reportValidity()) void handleAccountSubmit(registerForm, "/api/auth/register");
});
resetForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!resetForm.reportValidity()) return;
  const button = resetForm.querySelector("button[type='submit']");
  button.disabled = true;
  formStatus.textContent = "正在更新密码...";
  try {
    await submitJson("/api/auth/reset-password", {
      token: query.get("token") || "",
      ...formValues(resetForm)
    });
    formStatus.classList.add("is-success");
    formStatus.textContent = "密码已更新，旧登录状态已全部失效。正在前往登录...";
    window.setTimeout(() => window.location.assign("/auth.html"), 900);
  } catch (error) {
    formStatus.textContent = error instanceof Error ? error.message : "重置没有完成，请重新获取链接。";
  } finally {
    button.disabled = false;
  }
});

if (loginForm && registerForm) {
  setMode(query.get("mode") === "register" ? "register" : "login");
}
