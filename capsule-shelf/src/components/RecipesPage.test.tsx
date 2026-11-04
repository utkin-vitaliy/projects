import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { recipes } from "../data/recipes";
import { RecipesPage } from "./RecipesPage";
import { LocaleProvider } from "../i18n/locale";

function renderRecipesPage() {
  localStorage.setItem("capsule-shelf:locale:v1", "ru");
  return render(<LocaleProvider><RecipesPage /></LocaleProvider>);
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
});
