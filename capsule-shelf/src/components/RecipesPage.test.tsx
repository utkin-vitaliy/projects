import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { recipes } from "../data/recipes";
import { vertuoRecipes } from "../data/vertuoRecipes";
import { RecipesPage } from "./RecipesPage";
import { LocaleProvider } from "../i18n/locale";

function renderRecipesPage(system: "original" | "vertuo" = "original", favoriteIds?: string[], locale: "en" | "ru" | "fr" = "ru") {
  localStorage.setItem("capsule-shelf:locale:v1", locale);
  return render(<LocaleProvider><RecipesPage system={system} {...(favoriteIds === undefined ? {} : { favoriteIds })} /></LocaleProvider>);
}

afterEach(cleanup);

describe("RecipesPage", () => {
  it("renders every Russian recipe with ingredients and numbered preparation steps", () => {
    renderRecipesPage();

    expect(screen.getByRole("heading", { name: "Рецепты для твоей полки" })).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(recipes.length);
    expect(screen.queryByText(/Показано\s+23 рецепта из 23/)).not.toBeInTheDocument();
    expect(screen.queryByText(/В каталоге 23 рецепта/)).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Фильтр рецептов" })).toBeInTheDocument();

    for (const [index, recipe] of recipes.entries()) {
      const card = cards[index];
      expect(within(card).getByRole("heading", { name: recipe.title })).toBeInTheDocument();
      expect(within(card).getByRole("list", { name: "Ингредиенты" }).children).toHaveLength(recipe.ingredients.length);
      expect(within(card).getByRole("list", { name: "Приготовление" }).children).toHaveLength(recipe.steps.length);
      expect(within(card).getByText(recipe.capsule)).toBeInTheDocument();
      expect(within(card).getByRole("img", { name: recipe.imageAlt })).toHaveAttribute("src", recipe.imageUrl);
    }
  });

  it("links each card to its official recipe source safely", () => {
    renderRecipesPage();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(recipes.length);
    for (const [index, link] of links.entries()) {
      expect(link).toHaveAttribute("href", recipes[index].sourceUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }
  });

  it("explains Original substitutions on adapted recipe cards", () => {
    renderRecipesPage();

    for (const recipe of recipes.filter(({ adaptationNote }) => adaptationNote)) {
      const card = screen.getByRole("heading", { name: recipe.title }).closest("article");
      expect(card).toHaveTextContent(recipe.adaptationNote!);
    }
  });

  it("uses the book photo background only for cards sourced from the recipe book", () => {
    renderRecipesPage();

    for (const recipe of recipes) {
      const card = screen.getByRole("heading", { name: recipe.title }).closest("article");
      const photo = within(card!).getByRole("img", { name: recipe.imageAlt }).parentElement;
      if (recipe.sourcePage) {
        expect(photo).toHaveClass("recipe-card__photo--book");
      } else {
        expect(photo).not.toHaveClass("recipe-card__photo--book");
      }
    }
  });

  it("saves recipe favorites and filters the list to favorites", () => {
    renderRecipesPage();

    fireEvent.click(screen.getByRole("button", { name: "Добавить рецепт «Капучино» в избранное" }));
    expect(localStorage.getItem("capsule-shelf:recipe-favorites:v1")).toBe(JSON.stringify(["cappuccino"]));

    fireEvent.click(screen.getByRole("button", { name: "Избранное 1" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Капучино" })).toBeInTheDocument();
  });

  it("searches recipe titles and capsule names across languages", () => {
    renderRecipesPage();

    fireEvent.change(screen.getByRole("searchbox", { name: "Найти рецепт…" }), { target: { value: "cappuccino" } });
    expect(screen.getByRole("heading", { name: "Капучино" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Найти рецепт…" }), { target: { value: "Arpeggio" } });
    const matchingCards = screen.getAllByRole("article");
    expect(matchingCards.length).toBeGreaterThan(0);
    for (const card of matchingCards) expect(card).toHaveTextContent("Arpeggio");
  });

  it("shows only the selected system and scopes filter counts and favorites to it", () => {
    renderRecipesPage("vertuo", ["vertuo-black-iced", "cappuccino"]);

    expect(screen.getAllByRole("article")).toHaveLength(vertuoRecipes.length);
    expect(screen.getByRole("heading", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Капучино" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Все рецепты ${vertuoRecipes.length}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Избранное 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Горячие ${vertuoRecipes.filter(({ temperature }) => temperature === "hot").length}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Холодные ${vertuoRecipes.filter(({ temperature }) => temperature === "cold").length}` })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Избранное 1" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();
  });

  it("searches Vertuo recipes using titles and capsule names from any supported language", () => {
    renderRecipesPage("vertuo", [], "en");
    const search = screen.getByRole("searchbox", { name: "Find a recipe…" });

    fireEvent.change(search, { target: { value: "Чёрный кофе со льдом" } });
    expect(screen.getByRole("heading", { name: "Black Iced" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Капучино" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "Capsule Ice Forte" } });
    expect(screen.getByRole("heading", { name: "Black Iced" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Refreshing Citrus Latte" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(5);
  });

  it("opens a selected recipe in a dialog and closes it with Escape", () => {
    renderRecipesPage();
    const card = screen.getByRole("heading", { name: "Капучино" }).closest("article")!;

    fireEvent.click(card);
    expect(screen.getByRole("dialog", { name: "Капучино" })).toBeInTheDocument();
    expect(document.querySelector(".recipe-focus-backdrop")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Капучино" }).querySelector(".recipe-card__body")).toHaveClass("recipe-card__body--vertical");
    expect(screen.getByRole("dialog", { name: "Капучино" }).querySelector(".recipe-card__photo")).toHaveClass("recipe-card__photo--focused");
    expect(document.querySelector(".recipes-section")).toHaveClass("recipes-section--focused");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector(".recipes-section")).not.toHaveClass("recipes-section--focused");
    expect(card).toHaveFocus();

    fireEvent.click(card);
    fireEvent.click(document.querySelector(".recipe-focus-backdrop")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a capsule-linked recipe and keeps the favorite control independent", async () => {
    const onFocusRecipeChange = vi.fn();
    render(<LocaleProvider><RecipesPage system="vertuo" initialFocusRecipeId="vertuo-black-iced" onFocusRecipeChange={onFocusRecipeChange} /></LocaleProvider>);
    expect(await screen.findByRole("dialog", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Добавить рецепт «Чёрный кофе со льдом» в избранное" }));
    expect(screen.getByRole("dialog", { name: "Чёрный кофе со льдом" })).toBeInTheDocument();
    expect(within(screen.getByRole("dialog", { name: "Чёрный кофе со льдом" })).queryByRole("button", { name: "Закрыть рецепт" })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onFocusRecipeChange).toHaveBeenCalledWith(null);
  });
});
