const toast = document.querySelector("[data-toast]");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

async function copyText(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target.textContent.trim());
    showToast("コピーしました");
  } catch {
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    showToast("文章を選択しました");
  }
}

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", () => copyText(button.dataset.copyTarget));
});

document.querySelector("[data-share]")?.addEventListener("click", async () => {
  const shareData = {
    title: "くらしの最低線",
    text: "食費分を、食料物価に連動させよう。",
    url: "https://kurashi-saiteiten.pages.dev/",
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    showToast("共有文とURLをコピーしました");
  } catch {
    showToast("下のSNS共有文をご利用ください");
    document.querySelector("#copy")?.scrollIntoView();
  }
});
