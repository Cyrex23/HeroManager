package com.heromanager.repository;

import com.heromanager.entity.MaterialRecipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MaterialRecipeRepository extends JpaRepository<MaterialRecipe, Long> {
    @Query("SELECT r FROM MaterialRecipe r JOIN FETCH r.outputMaterial JOIN FETCH r.ingredients i JOIN FETCH i.materialTemplate")
    List<MaterialRecipe> findAllWithIngredients();
}
