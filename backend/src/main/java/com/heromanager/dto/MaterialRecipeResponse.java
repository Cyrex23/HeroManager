package com.heromanager.dto;

import java.util.List;

public record MaterialRecipeResponse(
    Long recipeId,
    Long outputMaterialId,
    String outputName,
    String outputIconKey,
    int outputTier,
    int outputQuantity,
    int currentQuantity,
    int craftHours,
    List<MaterialIngredient> ingredients
) {
    public record MaterialIngredient(
        Long materialId,
        String materialName,
        String iconKey,
        int required,
        int have
    ) {}
}
