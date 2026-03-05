package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "weapon_recipe_ingredient")
@Getter @Setter @NoArgsConstructor
public class WeaponRecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    private WeaponRecipe recipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_template_id", nullable = false)
    private MaterialTemplate materialTemplate;

    @Column(nullable = false)
    private int quantity;
}
