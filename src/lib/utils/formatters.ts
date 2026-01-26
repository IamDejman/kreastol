export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

export function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return "*".repeat(phone.length - 4) + phone.slice(-4);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked =
    local.length > 2 ? local[0] + "***" + local[local.length - 1] : "***";
  return `${masked}@${domain}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      return false;
    }
  }
}
