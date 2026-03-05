package com.heromanager.repository;

import com.heromanager.entity.WeaponRecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WeaponRecipeIngredientRepository extends JpaRepository<WeaponRecipeIngredient, Long> {
    List<WeaponRecipeIngredient> findByRecipeId(Long recipeId);
}
