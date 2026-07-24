export function accessCopy(isAuthenticated) {
  return isAuthenticated
    ? {
        listAction: "查看详情",
        detailState: "点击查看",
        detailDescription: "查看完整描述、来源链接、匹配理由与简历建议。"
      }
    : {
        listAction: "登录查看",
        detailState: "登录后可见",
        detailDescription: "登录后查看完整描述、来源链接、匹配理由与简历建议。"
      };
}
