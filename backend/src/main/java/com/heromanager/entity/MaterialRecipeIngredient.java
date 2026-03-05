package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "material_recipe_ingredient")
@Getter @Setter @NoArgsConstructor
public class MaterialRecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_recipe_id", nullable = false)
    private MaterialRecipe materialRecipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_template_id", nullable = false)
    private MaterialTemplate materialTemplate;

    @Column(nullable = false)
    private int quantity;
}
