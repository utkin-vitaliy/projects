import { useState } from "react";
import { recipes } from "../data/recipes";

type RecipeTemperature = "all" | "hot" | "cold";

export function RecipesPage() {
  const [temperature, setTemperature] = useState<RecipeTemperature>("all");
  const visibleRecipes = temperature === "all"
    ? recipes
    : recipes.filter((recipe) => recipe.temperature === temperature);

  return (
    <section className="recipes-section" aria-labelledby="recipes-title">
      <div className="recipes-toolbar">
        <header className="recipes-heading">
          <h2 id="recipes-title">Рецепты для твоей полки</h2>
        </header>

        <div className="recipe-filters" role="group" aria-label="Фильтр по температуре напитка">
          {([
            ["all", "Все"],
            ["hot", "Горячие"],
            ["cold", "Холодные"],
          ] as const).map(([value, label]) => {
            const count = value === "all" ? recipes.length : recipes.filter((recipe) => recipe.temperature === value).length;
            return (
              <button
                aria-pressed={temperature === value}
                className={`recipe-filter${temperature === value ? " is-active" : ""}`}
                key={value}
                onClick={() => setTemperature(value)}
                type="button"
              >
                {label} <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="recipe-grid">
        {visibleRecipes.map((recipe) => (
          <article className="recipe-card" key={recipe.id}>
            <div className={`recipe-card__photo${recipe.sourcePage ? " recipe-card__photo--book" : ""}`}>
              <img src={recipe.imageUrl} alt={recipe.imageAlt} loading="lazy" />
            </div>
            <div className="recipe-card__meta">
              <span>{recipe.line}</span>
              <span>{recipe.time}</span>
              <span>{recipe.difficulty}</span>
            </div>
            <h3>{recipe.title}</h3>
            <p className="recipe-card__capsule">Капсула: <strong>{recipe.capsule}</strong></p>
            {recipe.adaptationNote && <p className="recipe-card__adaptation">{recipe.adaptationNote}</p>}

            <div className="recipe-card__body">
              <div>
                <h4>Ингредиенты</h4>
                <ul aria-label="Ингредиенты">
                  {recipe.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
                </ul>
              </div>
              <div>
                <h4>Приготовление</h4>
                <ol aria-label="Приготовление">
                  {recipe.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
            </div>

            <a className="recipe-card__source" href={recipe.sourceUrl} rel="noreferrer" target="_blank">
              {recipe.sourceLabel} <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
