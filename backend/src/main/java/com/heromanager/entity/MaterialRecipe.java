package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "material_recipe")
@Getter @Setter @NoArgsConstructor
public class MaterialRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "output_material_template_id", nullable = false, unique = true)
    private MaterialTemplate outputMaterial;

    @Column(nullable = false)
    private int outputQuantity = 1;

    @Column(name = "craft_hours", nullable = false)
    private int craftHours = 2;

    @OneToMany(mappedBy = "materialRecipe", fetch = FetchType.LAZY)
    private List<MaterialRecipeIngredient> ingredients;
}
