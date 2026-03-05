package com.heromanager.repository;

import com.heromanager.entity.WeaponRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface WeaponRecipeRepository extends JpaRepository<WeaponRecipe, Long> {
    Optional<WeaponRecipe> findByItemTemplateId(Long itemTemplateId);

    @Query("SELECT r FROM WeaponRecipe r JOIN FETCH r.itemTemplate JOIN FETCH r.ingredients i JOIN FETCH i.materialTemplate")
    List<WeaponRecipe> findAllWithIngredients();
}
