import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const legacyKey = "capsule-shelf:inventory:v1";
const currentKey = "capsule-shelf:inventory:v2";

function storedInventory() {
  const raw = localStorage.getItem(currentKey);
  return raw ? JSON.parse(raw).inventory as Record<string, Record<string, unknown>> : {};
}

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  localStorage.clear();
  localStorage.setItem("capsule-shelf:locale:v1", "ru");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function waitForReady() {
  await waitFor(() => expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false"));
}

async function addCapsules(name: string, amount: number) {
  const input = await screen.findByRole("spinbutton", { name: `Количество капсул ${name}` }) as HTMLInputElement;
  const next = Number(input.value) + amount;
  fireEvent.change(input, { target: { value: String(next) } });
  fireEvent.blur(input);
}

describe("Capsule Shelf dashboard", () => {
  it("uses the browser's preferred supported language when no language has been saved", async () => {
    localStorage.removeItem("capsule-shelf:locale:v1");
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["fr-CA", "en-CA"]);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Ma collection de cafés" })).toBeInTheDocument();
  });

  it("lets the user switch languages with compact code buttons and remembers the selection", async () => {
    render(<App />);
    await waitForReady();

    expect(screen.queryByText("Язык")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Язык" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Английский" }));

    expect(screen.getByRole("heading", { name: "My Coffee Shelf" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recipes" })).toBeInTheDocument();
    expect(localStorage.getItem("capsule-shelf:locale:v1")).toBe("en");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the public GitHub feedback form in the selected language", async () => {
    render(<App />);
    await waitForReady();

    const feedback = screen.getByRole("link", { name: "Оставить отзыв ↗" });
    expect(feedback).toHaveAttribute("href", "https://github.com/utkin-vitaliy/projects/issues/new?template=feedback-ru.yml");
    expect(feedback).toHaveAttribute("target", "_blank");
    expect(feedback).toHaveAttribute("rel", "noreferrer");
    expect(screen.getByText("Откроется GitHub; сообщение будет публичным.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Английский" }));
    expect(screen.getByRole("link", { name: "Leave feedback ↗" })).toHaveAttribute("href", "https://github.com/utkin-vitaliy/projects/issues/new?template=feedback-en.yml");
    expect(screen.getByText("Opens GitHub; your post will be public.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "French" }));
    expect(screen.getByRole("link", { name: "Partager vos commentaires ↗" })).toHaveAttribute("href", "https://github.com/utkin-vitaliy/projects/issues/new?template=feedback-fr.yml");
    expect(screen.getByText("GitHub s’ouvrira ; votre message sera public.")).toBeInTheDocument();
  });

  it("keeps backup controls and feedback together on the right side of the footer", async () => {
    render(<App />);
    await waitForReady();

    const actionGroup = document.querySelector(".page-footer__actions");
    expect(actionGroup).not.toBeNull();
    const settingsDropdown = within(actionGroup as HTMLElement).getByRole("button", { name: "Данные" });
    fireEvent.click(settingsDropdown);
    expect(within(actionGroup as HTMLElement).getByRole("button", { name: "Экспорт данных" })).toBeInTheDocument();
    expect(within(actionGroup as HTMLElement).getByRole("button", { name: "Импорт данных" })).toBeInTheDocument();
    expect(within(actionGroup as HTMLElement).getByRole("link", { name: "Оставить отзыв ↗" })).toBeInTheDocument();
    expect(actionGroup?.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("closes the settings dropdown on Escape and returns focus to its trigger", async () => {
    render(<App />);
    await waitForReady();

    const trigger = screen.getByRole("button", { name: "Данные" });
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Экспорт данных" })).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: "Escape" });

    expect(document.querySelector(".settings-dropdown")?.hasAttribute("open")).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it("imports a settings backup into this browser", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);
    await waitForReady();

    const backup = new File([""], "capsule-shelf.json", { type: "application/json" });
    Object.defineProperty(backup, "text", { value: async () => JSON.stringify({
      format: "capsule-shelf-user-settings",
      version: 1,
      updatedAt: "2026-11-04T12:00:00.000Z",
      locale: "en",
      system: "vertuo",
      inventory: { "vertuo-melozio": { quantity: 17, favorite: true, threshold: 5, note: { tastingNotes: "Honey" } } },
      favoriteRecipes: ["vertuo-black-iced"],
    }) });
    fireEvent.click(screen.getByRole("button", { name: "Данные" }));
    fireEvent.click(screen.getByRole("button", { name: "Импорт данных" }));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [backup] } });

    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(await screen.findByRole("heading", { name: "Melozio" })).toBeInTheDocument();
    await waitFor(() => {
      const imported = JSON.parse(localStorage.getItem("capsule-shelf:user-settings:v1") ?? "{}");
      expect(imported.inventory["vertuo-melozio"]).toMatchObject({ quantity: 17, favorite: true, note: { tastingNotes: "Honey" } });
      expect(imported.favoriteRecipes).toContain("vertuo-black-iced");
      expect(imported.system).toBe("vertuo");
    });
  });

  it("places the Google Drive sync control in the header instead of the footer", async () => {
    render(<App />);
    await waitForReady();

    const connect = screen.getByRole("button", { name: "Подключить Google Drive" });
    expect(connect.closest(".page-header")).not.toBeNull();
    expect(connect.closest(".page-footer")).toBeNull();
  });

  it("shows Vertuo products and restores their independent stock after reload", async () => {
    const { unmount } = render(<App />);
    await waitForReady();

    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    expect(screen.getByRole("heading", { name: "Melozio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Рецепты для Melozio/ })).toBeInTheDocument();
    expect(screen.getAllByText(/230 ml/).length).toBeGreaterThan(0);
    const vertuoCount = screen.getByRole("spinbutton", { name: "Количество капсул Melozio" });
    fireEvent.change(vertuoCount, { target: { value: "12" } });
    fireEvent.blur(vertuoCount);
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("capsule-shelf:user-settings:v1") ?? "{}");
      expect(stored.system).toBe("vertuo");
      expect(stored.inventory["vertuo-melozio"].quantity).toBe(12);
    });
    await waitFor(() => {
      const storedInventory = JSON.parse(localStorage.getItem("capsule-shelf:inventory:v2") ?? "{}");
      expect(storedInventory.inventory["vertuo-melozio"].quantity).toBe(12);
    });

    fireEvent.click(screen.getByRole("button", { name: "Original" }));
    expect(screen.getByRole("heading", { name: "Arpeggio" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Melozio" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(0);
    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    expect(screen.getByLabelText("Количество капсул Melozio")).toHaveValue(12);

    unmount();
    const second = render(<App />);
    await waitForReady();
    expect(screen.getByRole("button", { name: "Vertuo" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Количество капсул Melozio")).toHaveValue(12);
    expect(screen.getByRole("button", { name: "Рецепты" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Рецепты" }));
    // The recipe page intentionally has no section title; its cards begin the view.
    expect(await screen.findByRole("heading", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Капучино" })).not.toBeInTheDocument();
    const favorite = screen.getByRole("button", { name: "Добавить рецепт «Чёрный кофе со льдом» в избранное" });
    fireEvent.click(favorite);
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("capsule-shelf:user-settings:v1") ?? "{}");
      expect(stored.favoriteRecipes).toContain("vertuo-black-iced");
    });
    second.unmount();
    render(<App />);
    await waitForReady();
    expect(screen.getByRole("button", { name: "Vertuo" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Рецепты" }));
    expect(screen.getByRole("button", { name: "Убрать рецепт «Чёрный кофе со льдом» из избранного" })).toHaveAttribute("aria-pressed", "true");
  }, 10_000);

  it("opens a Vertuo recipe from its Vertuo capsule and keeps the official source", async () => {
    render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    const search = screen.getByRole("searchbox", { name: "Найти капсулу…" });
    fireEvent.change(search, { target: { value: "Ice Forte" } });

    const capsuleCard = screen.getByRole("heading", { name: "Ice Forte" }).closest("article")!;
    fireEvent.click(within(capsuleCard).getByRole("button", { name: /Рецепты для Ice Forte/ }));
    fireEvent.click(await within(capsuleCard).findByRole("link", { name: "Чёрный кофе со льдом" }));

    const recipeHeading = await screen.findByRole("heading", { name: "Чёрный кофе со льдом" });
    expect(recipeHeading.closest("article")).toHaveAttribute("id", "recipe-vertuo-black-iced");
    expect(within(recipeHeading.closest("article")!).getByRole("link", { name: /Источник: Nespresso/ }))
      .toHaveAttribute("href", "https://www.nespresso.com/ca/en/recipe?id=black-iced");
  });

  it("remembers a linked Google account and loads its inventory after reload", async () => {
    localStorage.setItem("capsule-shelf:google-account:v1", JSON.stringify({ sub: "google-user-123", email: "user@example.com" }));
    localStorage.setItem("capsule-shelf:locale:v1:google:google-user-123", "ru");
    localStorage.setItem("capsule-shelf:inventory:v2:google:google-user-123", JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 9, favorite: false, threshold: 5, note: {} },
    } }));

    render(<App />);
    await waitForReady();

    expect(screen.getByRole("button", { name: /Google Drive запомнен/ })).toHaveAttribute("data-state", "remembered");
    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(9);
    expect(localStorage.getItem("capsule-shelf:google-account:v1")).not.toContain("accessToken");
  });

  it("switches to recipes and back without losing inventory quantities", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 3);

    fireEvent.click(screen.getByRole("button", { name: "Рецепты" }));
    // The recipe page intentionally has no section title; its cards begin the view.
    expect(screen.getByRole("heading", { name: "Капучино" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Количество капсул Arpeggio")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Капсулы" }));
    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(3);
  });

  it("opens a matching recipe from its capsule card in the focus dialog", async () => {
    render(<App />);
    await waitForReady();

    const capsuleCard = screen.getByRole("heading", { name: "Arpeggio" }).closest("article")!;
    fireEvent.click(within(capsuleCard).getByRole("button", { name: /Рецепты для Arpeggio/ }));
    const recipeLink = within(capsuleCard).getByRole("link", { name: "Кленовый капучино с пеканом" });
    fireEvent.click(recipeLink);

    const recipeHeading = await screen.findByRole("heading", { name: "Кленовый капучино с пеканом" });
    await waitFor(() => expect(recipeHeading.closest("article")).toHaveAttribute("role", "dialog"));
    expect(recipeHeading.closest("article")).toHaveAttribute("id", "recipe-maple-pecan-cappuccino");
  });

  it("loads stock controls immediately and saves quantity changes to browser storage", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 3);
    await addCapsules("Volluto", 2);
    expect(screen.getByLabelText("Всего капсул")).toHaveTextContent("5");
    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(3);
    fireEvent.change(screen.getByLabelText("Количество капсул Arpeggio"), { target: { value: "2" } });
    fireEvent.blur(screen.getByLabelText("Количество капсул Arpeggio"));
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ quantity: 2 }));
    expect(screen.getByLabelText("Всего капсул")).toHaveTextContent("4");
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it("does not request a server API when loading or saving the inventory", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 1);
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ quantity: 1 }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a favorite at the threshold and clears the alert above it", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 5);
    fireEvent.click(screen.getByRole("button", { name: "Добавить Arpeggio в избранное" }));
    expect(screen.getByText("Arpeggio — осталось 5")).toBeInTheDocument();
    await addCapsules("Arpeggio", 1);
    expect(screen.queryByText("Arpeggio — осталось 5")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Сорта, которым пора пополнить запас")).toHaveTextContent("0");
  });

  it("lets a favorite use a custom low-stock threshold and persists it in the browser", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 5);
    fireEvent.click(screen.getByRole("button", { name: "Добавить Arpeggio в избранное" }));
    expect(screen.getByText("Arpeggio — осталось 5")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Порог запаса Arpeggio"), { target: { value: "3" } });
    expect(screen.queryByText("Arpeggio — осталось 5")).not.toBeInTheDocument();
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ threshold: 3 }));
  });

  it("filters the catalog to favorites and low stock", async () => {
    render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Добавить Arpeggio в избранное" }));
    fireEvent.click(screen.getByRole("button", { name: "Избранное" }));
    expect(screen.getByRole("heading", { name: "Arpeggio" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Volluto" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Пора пополнить" }));
    expect(screen.getByRole("heading", { name: "Arpeggio" })).toBeInTheDocument();
  });

  it("shows the favorite variety count and remembers each system's selected filter after reload", async () => {
    render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Добавить Arpeggio в избранное" }));
    fireEvent.click(screen.getByRole("button", { name: "Избранное" }));
    expect(screen.getByRole("button", { name: "Избранное" })).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    fireEvent.click(screen.getByRole("button", { name: "Пора пополнить" }));
    fireEvent.click(screen.getByRole("button", { name: "Original" }));
    expect(screen.getByRole("button", { name: "Избранное" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    expect(screen.getByRole("button", { name: "Пора пополнить" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("capsule-shelf:user-settings:v1") ?? "{}").filters).toEqual({ original: "favorites", vertuo: "low" }));

    cleanup();
    render(<App />);
    await waitForReady();
    expect(screen.getByRole("button", { name: "Vertuo" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Пора пополнить" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Original" }));
    expect(screen.getByRole("button", { name: "Избранное" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not briefly show All varieties while restoring a saved Favorites filter", async () => {
    localStorage.setItem("capsule-shelf:user-settings:v1", JSON.stringify({
      format: "capsule-shelf-user-settings",
      version: 1,
      updatedAt: "2026-11-05T12:00:00.000Z",
      locale: "ru",
      system: "original",
      filters: { original: "favorites", vertuo: "all" },
      inventory: {},
      favoriteRecipes: [],
    }));
    const brieflySelectedAll: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === "aria-pressed" && record.oldValue === "true" && record.target instanceof HTMLButtonElement && record.target.classList.contains("filter-tab")) {
          brieflySelectedAll.push(record.target.textContent?.trim() ?? "");
        }
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["aria-pressed"] });

    render(<App />);
    await waitForReady();
    await waitFor(() => expect(screen.getByRole("button", { name: "Избранное" })).toHaveAttribute("aria-pressed", "true"));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    observer.disconnect();

    expect(brieflySelectedAll).not.toContain("Все сорта");
  });

  it("restores saved recipe Favorites without briefly selecting All recipes", async () => {
    window.history.replaceState(null, "", "/#recipes");
    localStorage.setItem("capsule-shelf:user-settings:v1", JSON.stringify({
      format: "capsule-shelf-user-settings",
      version: 1,
      updatedAt: "2026-11-05T12:00:00.000Z",
      locale: "ru",
      system: "original",
      filters: { original: "all", vertuo: "all" },
      recipeFilters: { original: "favorites", vertuo: "all" },
      inventory: {},
      favoriteRecipes: ["cappuccino"],
    }));
    const brieflySelectedAll: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === "aria-pressed" && record.oldValue === "true" && record.target instanceof HTMLButtonElement && record.target.classList.contains("recipe-filter")) {
          brieflySelectedAll.push(record.target.textContent?.trim() ?? "");
        }
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ["aria-pressed"] });

    render(<App />);
    await waitForReady();
    const recipeFilters = screen.getByRole("group", { name: "Фильтр рецептов" });
    await waitFor(() => expect(within(recipeFilters).getByRole("button", { name: /Избранное/ })).toHaveAttribute("aria-pressed", "true"));
    expect(screen.getByRole("heading", { name: "Капучино" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Эспрессо мартини Nespresso" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    const vertuoFilters = screen.getByRole("group", { name: "Фильтр рецептов" });
    expect(within(vertuoFilters).getByRole("button", { name: /Все рецепты/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Добавить рецепт «Чёрный кофе со льдом» в избранное" }));
    fireEvent.click(within(vertuoFilters).getByRole("button", { name: /Избранное/ }));
    expect(screen.getByRole("heading", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Original" }));
    const originalFilters = screen.getByRole("group", { name: "Фильтр рецептов" });
    expect(within(originalFilters).getByRole("button", { name: /Избранное/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(originalFilters).getByRole("button", { name: /Все рецепты/ }));
    fireEvent.click(screen.getByRole("button", { name: "Vertuo" }));
    expect(within(screen.getByRole("group", { name: "Фильтр рецептов" })).getByRole("button", { name: /Избранное/ })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(JSON.parse(localStorage.getItem("capsule-shelf:user-settings:v1") ?? "{}").recipeFilters).toEqual({ original: "all", vertuo: "favorites" }));

    cleanup();
    render(<App />);
    await waitForReady();
    expect(screen.getByRole("button", { name: "Vertuo" })).toHaveAttribute("aria-pressed", "true");
    const reloadedFilters = screen.getByRole("group", { name: "Фильтр рецептов" });
    expect(within(reloadedFilters).getByRole("button", { name: /Избранное/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    observer.disconnect();

    expect(brieflySelectedAll).not.toContain("Все рецепты");
  });

  it("offers only populated categories and filters the catalog by category", async () => {
    render(<App />);
    await waitForReady();
    const category = screen.getByRole("combobox", { name: "Категория сортов" });
    expect(within(category).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Все категории", "Лимитированные", "Итальянские", "Без кофеина", "Кофейные культуры мира", "Кофе по происхождению", "Ароматизированные", "Классика",
    ]);
    fireEvent.change(category, { target: { value: "origins" } });
    const names = screen.getAllByRole("article").map((article) => within(article).getByRole("heading", { level: 2 }).textContent);
    expect(names).toEqual(["Colombia", "Kahawa ya Congo", "India", "Indonesia - Fairtrade", "Nicaragua"]);
  });

  it("composes category with favorites and shows an empty message when they do not intersect", async () => {
    render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Добавить Arpeggio в избранное" }));
    fireEvent.click(screen.getByRole("button", { name: "Избранное" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Категория сортов" }), { target: { value: "origins" } });
    expect(screen.getByText("Здесь пока пусто")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Arpeggio" })).not.toBeInTheDocument();
  });

  it("composes category with low stock without exposing unknown saved IDs", async () => {
    localStorage.setItem(currentKey, JSON.stringify({ format: "capsule-shelf-settings", version: 1, inventory: { "retired-variety": { quantity: 4, favorite: true, threshold: 2, note: {} } } }));
    render(<App />);
    await waitForReady();
    await addCapsules("Colombia", 1);
    fireEvent.click(screen.getByRole("button", { name: "Добавить Colombia в избранное" }));
    fireEvent.click(screen.getByRole("button", { name: "Пора пополнить" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Категория сортов" }), { target: { value: "origins" } });
    expect(screen.getByRole("heading", { name: "Colombia" })).toBeInTheDocument();
    expect(screen.queryByText("retired-variety")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("keeps favorite capsules in their original catalog order", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 10);
    fireEvent.click(screen.getByRole("button", { name: "Добавить Arpeggio в избранное" }));
    await addCapsules("Ristretto", 5);
    fireEvent.click(screen.getByRole("button", { name: "Добавить Ristretto в избранное" }));
    const names = screen.getAllByRole("article").map((article) => within(article).getByRole("heading", { level: 2 }).textContent);
    expect(names.slice(0, 3)).toEqual(["Arpeggio", "Ristretto", "Ispirazione Napoli"]);
  });

  it("edits tasting notes and keeps them after the app reloads", async () => {
    const first = render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Заметки Arpeggio" }));
    fireEvent.click(screen.getByRole("button", { name: "Нравится" }));
    fireEvent.change(screen.getByLabelText("Личная заметка о вкусе"), { target: { value: "Какао и плотная crema" } });
    fireEvent.change(screen.getByLabelText("Рецепты"), { target: { value: "Капучино" } });
    fireEvent.change(screen.getByLabelText("Подходит для"), { target: { value: "Молочных напитков" } });
    fireEvent.change(screen.getByLabelText("Не лучший выбор для"), { target: { value: "Очень длинного лунго" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить заметки Arpeggio" }));
    expect(screen.getByText("Заметки сохранены")).toBeInTheDocument();
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ note: { recipes: "Капучино", tastingNotes: "Какао и плотная crema" } }));
    first.unmount();
    render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Заметки Arpeggio" }));
    expect(screen.getByLabelText("Личная заметка о вкусе")).toHaveValue("Какао и плотная crema");
    expect(screen.getByLabelText("Рецепты")).toHaveValue("Капучино");
    expect(screen.getByLabelText("Подходит для")).toHaveValue("Молочных напитков");
    expect(screen.getByLabelText("Не лучший выбор для")).toHaveValue("Очень длинного лунго");
    expect(screen.getByRole("button", { name: "Нравится" })).toHaveAttribute("aria-pressed", "true");
  });

  it("migrates legacy browser inventory once into the current browser key", async () => {
    localStorage.setItem(legacyKey, JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 8, favorite: true, threshold: 2, note: { rating: "like", tastingNotes: "Густой", recipes: "Капучино", suitableFor: "Молоко", unsuitableFor: "Лунго" } },
    } }));
    render(<App />);
    await waitForReady();

    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(8);
    expect(storedInventory().arpeggio).toMatchObject({
      quantity: 8,
      favorite: true,
      threshold: 2,
      note: { rating: "like", tastingNotes: "Густой", recipes: "Капучино", suitableFor: "Молоко", unsuitableFor: "Лунго" },
    });
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it("preserves retired variety data when migrating legacy browser inventory", async () => {
    localStorage.setItem(legacyKey, JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 2, favorite: false, threshold: 5, note: {} },
      "retired-variety": { quantity: 7, favorite: true, threshold: 3, note: { tastingNotes: "old" } },
    } }));
    render(<App />);
    await waitForReady();

    expect(storedInventory()["retired-variety"]).toMatchObject({ quantity: 7, favorite: true, threshold: 3 });
    expect(storedInventory().arpeggio).toMatchObject({ quantity: 2 });
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  it("prefers current browser data over legacy browser data", async () => {
    localStorage.setItem(currentKey, JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 3, favorite: false, threshold: 5, note: { rating: null } },
    } }));
    localStorage.setItem(legacyKey, JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 99, favorite: false, threshold: 5, note: { rating: null } },
    } }));
    render(<App />);
    await waitForReady();

    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(3);
    expect(localStorage.getItem(legacyKey)).not.toBeNull();
  });

  it("keeps legacy data when migration cannot be saved to browser storage", async () => {
    localStorage.setItem(legacyKey, JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 4, favorite: false, threshold: 5, note: {} },
      "retired-variety": { quantity: 7, favorite: true, threshold: 3, note: {} },
    } }));
    const realSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === currentKey) throw new Error("quota exceeded");
      realSetItem.call(this, key, value);
    });
    render(<App />);
    await waitForReady();

    expect(await screen.findByRole("status")).toHaveTextContent("Не удалось сохранить данные в браузере");
    expect(localStorage.getItem(legacyKey)).not.toBeNull();
    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(4);
    expect(screen.getByLabelText("Всего капсул")).toHaveTextContent("4");
  });

  it("keeps the in-memory shelf usable when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["ru"]);
    render(<App />);
    await waitForReady();

    expect(await screen.findByRole("status")).toHaveTextContent("Браузерное хранилище недоступно");
    await addCapsules("Arpeggio", 1);
    expect(screen.getByLabelText("Количество капсул Arpeggio")).toHaveValue(1);
  });

  it("shows a backup notice when browser storage writes fail", async () => {
    render(<App />);
    await waitForReady();
    const realSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === currentKey) throw new Error("quota exceeded");
      realSetItem.call(this, key, value);
    });
    await addCapsules("Arpeggio", 1);

    expect(await screen.findByRole("status")).toHaveTextContent("Не удалось сохранить данные в браузере");
  });

  it("sets a capsule stock count directly and persists the value across reloads", async () => {
    const first = render(<App />);
    await waitForReady();
    const input = screen.getByRole("spinbutton", { name: "Количество капсул Arpeggio" });
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(40);
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ quantity: 40 }));
    first.unmount();
    render(<App />);
    await waitForReady();
    expect(screen.getByRole("spinbutton", { name: "Количество капсул Arpeggio" })).toHaveValue(40);
  });

  it("commits and persists a direct stock count when Enter is pressed", async () => {
    render(<App />);
    await waitForReady();
    const input = screen.getByRole("spinbutton", { name: "Количество капсул Arpeggio" });
    input.focus();
    fireEvent.change(input, { target: { value: "23" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(input).toHaveValue(23);
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ quantity: 23 }));
  });

  it("rejects a negative or fractional stock count", async () => {
    render(<App />);
    await waitForReady();
    const input = screen.getByRole("spinbutton", { name: "Количество капсул Arpeggio" });
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: "-2" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(40);
    fireEvent.change(input, { target: { value: "2.5" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(40);
  });

  it("adjusts stock by one with plus and minus controls without going below zero", async () => {
    render(<App />);
    await waitForReady();
    const minus = screen.getByRole("button", { name: "Убрать одну капсулу Arpeggio" });
    const plus = screen.getByRole("button", { name: "Добавить капсулу Arpeggio" });
    expect(minus).toBeDisabled();
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton", { name: "Количество капсул Arpeggio" })).toHaveValue(1);
    expect(minus).toBeEnabled();
    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(screen.getByRole("spinbutton", { name: "Количество капсул Arpeggio" })).toHaveValue(0);
    expect(minus).toBeDisabled();
  });

  it("shows a helpful empty state when a filter has no results", async () => {
    render(<App />);
    await waitForReady();
    fireEvent.click(screen.getByRole("button", { name: "Избранное" }));
    expect(screen.getByText("Здесь пока пусто")).toBeInTheDocument();
    expect(screen.getByText("Отметь любимый сорт или проверь пороги запаса.")).toBeInTheDocument();
  });

  it("shows a fallback when a catalog image fails to load", async () => {
    render(<App />);
    await waitForReady();
    fireEvent.error(screen.getByRole("img", { name: "Arpeggio" }));
    const card = screen.getByRole("heading", { name: "Arpeggio" }).closest("article");
    expect(within(card as HTMLElement).getByText("Фото сорта временно недоступно")).toBeInTheDocument();
  });

  it("preserves unknown browser records when the catalog grows and another stock value is saved", async () => {
    localStorage.setItem(currentKey, JSON.stringify({ version: 1, inventory: {
      "retired-variety": { quantity: 7, favorite: true, threshold: 3, note: { rating: "like", tastingNotes: "old", recipes: "", suitableFor: "", unsuitableFor: "" } },
    } }));
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 1);
    await waitFor(() => expect(storedInventory()["retired-variety"]).toMatchObject({ quantity: 7, favorite: true, threshold: 3 }));
  });

});
