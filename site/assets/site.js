const dialog = document.querySelector("[data-search-dialog]");
const searchInput = document.querySelector("[data-search-input]");
const searchResults = document.querySelector("[data-search-results]");
let searchIndex = [];

async function ensureIndex() {
  if (searchIndex.length) return;
  const response = await fetch("/assets/search-index.json");
  if (!response.ok) throw new Error("Search index could not be loaded");
  searchIndex = await response.json();
}

function resultMarkup(items) {
  if (!items.length) return '<p class="search-empty">一致する記事はありません。</p>';
  return items.map((item) => `<a class="search-result" href="${item.url}"><small>${item.label}</small><b>${item.title}</b></a>`).join("");
}

async function openSearch() {
  if (!dialog) return;
  dialog.showModal();
  searchInput.focus();
  try {
    await ensureIndex();
    searchResults.innerHTML = resultMarkup(searchIndex);
  } catch {
    searchResults.innerHTML = '<p class="search-empty">検索を読み込めませんでした。</p>';
  }
}

document.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", openSearch));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
});

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLocaleLowerCase("ja");
  const matches = query
    ? searchIndex.filter((item) => `${item.title} ${item.summary} ${item.label}`.toLocaleLowerCase("ja").includes(query))
    : searchIndex;
  searchResults.innerHTML = resultMarkup(matches);
});

const filter = document.querySelector("[data-card-filter]");
const cards = [...document.querySelectorAll("[data-article-card]")];
const emptyState = document.querySelector("[data-empty-state]");
filter?.addEventListener("input", () => {
  const query = filter.value.trim().toLocaleLowerCase("ja");
  let visible = 0;
  cards.forEach((card) => {
    const show = card.dataset.searchText.includes(query);
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (emptyState) emptyState.hidden = visible !== 0;
});
