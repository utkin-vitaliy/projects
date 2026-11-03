import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { recipes } from "../data/recipes";
import { RecipesPage } from "./RecipesPage";

afterEach(cleanup);

describe("RecipesPage", () => {
  it("renders every Russian recipe with ingredients and numbered preparation steps", () => {
    render(<RecipesPage />);

    expect(screen.getByRole("heading", { name: "Рецепты для твоей полки" })).toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(23);
    expect(screen.queryByText(/Показано\s+23 рецепта из 23/)).not.toBeInTheDocument();
    expect(screen.queryByText(/В каталоге 23 рецепта/)).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Фильтр по температуре напитка" })).toBeInTheDocument();

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
    render(<RecipesPage />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(23);
    for (const [index, link] of links.entries()) {
      expect(link).toHaveAttribute("href", recipes[index].sourceUrl);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }
  });

  it("explains Original substitutions on adapted recipe cards", () => {
    render(<RecipesPage />);

    for (const recipe of recipes.filter(({ adaptationNote }) => adaptationNote)) {
      const card = screen.getByRole("heading", { name: recipe.title }).closest("article");
      expect(card).toHaveTextContent(recipe.adaptationNote!);
    }
  });

  it("uses the book photo background only for cards sourced from the recipe book", () => {
    render(<RecipesPage />);

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
});
