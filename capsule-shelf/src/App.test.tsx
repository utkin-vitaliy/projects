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
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function waitForReady() {
  await waitFor(() => expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false"));
}

async function addCapsules(name: string, amount: number) {
  const input = await screen.findByRole("spinbutton", { name: `Количество ${name}` }) as HTMLInputElement;
  const next = Number(input.value) + amount;
  fireEvent.change(input, { target: { value: String(next) } });
  fireEvent.blur(input);
}

describe("Capsule Shelf dashboard", () => {
  it("switches to recipes and back without losing inventory quantities", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 3);

    fireEvent.click(screen.getByRole("button", { name: "Рецепты" }));
    expect(screen.getByRole("heading", { name: "Рецепты для твоей полки" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Капучино" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Количество Arpeggio")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Капсулы" }));
    expect(screen.getByLabelText("Количество Arpeggio")).toHaveValue(3);
  });

  it("opens a matching recipe from its capsule card and focuses the recipe card", async () => {
    render(<App />);
    await waitForReady();

    const capsuleCard = screen.getByRole("heading", { name: "Arpeggio" }).closest("article")!;
    fireEvent.click(within(capsuleCard).getByRole("button", { name: /Рецепты для Arpeggio/ }));
    const recipeLink = within(capsuleCard).getByRole("link", { name: "Кленовый капучино с пеканом" });
    fireEvent.click(recipeLink);

    const recipeHeading = await screen.findByRole("heading", { name: "Кленовый капучино с пеканом" });
    await waitFor(() => expect(recipeHeading.closest("article")).toHaveFocus());
    expect(recipeHeading.closest("article")).toHaveAttribute("id", "recipe-maple-pecan-cappuccino");
  });

  it("loads stock controls immediately and saves quantity changes to browser storage", async () => {
    render(<App />);
    await waitForReady();
    await addCapsules("Arpeggio", 3);
    await addCapsules("Volluto", 2);
    expect(screen.getByLabelText("Всего капсул")).toHaveTextContent("5");
    expect(screen.getByLabelText("Количество Arpeggio")).toHaveValue(3);
    fireEvent.change(screen.getByLabelText("Количество Arpeggio"), { target: { value: "2" } });
    fireEvent.blur(screen.getByLabelText("Количество Arpeggio"));
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
    fireEvent.change(screen.getByLabelText("Не подходит для"), { target: { value: "Очень длинного лунго" } });
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
    expect(screen.getByLabelText("Не подходит для")).toHaveValue("Очень длинного лунго");
    expect(screen.getByRole("button", { name: "Нравится" })).toHaveAttribute("aria-pressed", "true");
  });

  it("migrates legacy browser inventory once into the current browser key", async () => {
    localStorage.setItem(legacyKey, JSON.stringify({ version: 1, inventory: {
      arpeggio: { quantity: 8, favorite: true, threshold: 2, note: { rating: "like", tastingNotes: "Густой", recipes: "Капучино", suitableFor: "Молоко", unsuitableFor: "Лунго" } },
    } }));
    render(<App />);
    await waitForReady();

    expect(screen.getByLabelText("Количество Arpeggio")).toHaveValue(8);
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

    expect(screen.getByLabelText("Количество Arpeggio")).toHaveValue(3);
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
    expect(screen.getByLabelText("Количество Arpeggio")).toHaveValue(4);
    expect(screen.getByLabelText("Всего капсул")).toHaveTextContent("4");
  });

  it("keeps the in-memory shelf usable when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<App />);
    await waitForReady();

    expect(await screen.findByRole("status")).toHaveTextContent("Браузерное хранилище недоступно");
    await addCapsules("Arpeggio", 1);
    expect(screen.getByLabelText("Количество Arpeggio")).toHaveValue(1);
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
    const input = screen.getByRole("spinbutton", { name: "Количество Arpeggio" });
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.blur(input);
    expect(input).toHaveValue(40);
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ quantity: 40 }));
    first.unmount();
    render(<App />);
    await waitForReady();
    expect(screen.getByRole("spinbutton", { name: "Количество Arpeggio" })).toHaveValue(40);
  });

  it("commits and persists a direct stock count when Enter is pressed", async () => {
    render(<App />);
    await waitForReady();
    const input = screen.getByRole("spinbutton", { name: "Количество Arpeggio" });
    input.focus();
    fireEvent.change(input, { target: { value: "23" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(input).toHaveValue(23);
    await waitFor(() => expect(storedInventory().arpeggio).toMatchObject({ quantity: 23 }));
  });

  it("rejects a negative or fractional stock count", async () => {
    render(<App />);
    await waitForReady();
    const input = screen.getByRole("spinbutton", { name: "Количество Arpeggio" });
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
    const minus = screen.getByRole("button", { name: "Уменьшить капсулы Arpeggio" });
    const plus = screen.getByRole("button", { name: "Добавить капсулу Arpeggio" });
    expect(minus).toBeDisabled();
    fireEvent.click(plus);
    expect(screen.getByRole("spinbutton", { name: "Количество Arpeggio" })).toHaveValue(1);
    expect(minus).toBeEnabled();
    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(screen.getByRole("spinbutton", { name: "Количество Arpeggio" })).toHaveValue(0);
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
