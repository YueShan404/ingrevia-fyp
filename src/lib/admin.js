const DEFAULT_ADMIN_EMAILS = ["shanyuew416@gmail.com"];

export function getAdminEmails() {
  const configured = import.meta.env.VITE_ADMIN_EMAILS || "";
  const emails = configured
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return emails.length > 0 ? emails : DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
