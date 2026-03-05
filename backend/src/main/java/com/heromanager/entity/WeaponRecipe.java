package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "weapon_recipe")
@Getter @Setter @NoArgsConstructor
public class WeaponRecipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_template_id", nullable = false, unique = true)
    private ItemTemplate itemTemplate;

    @Column(name = "craft_hours", nullable = false)
    private int craftHours = 24;

    @OneToMany(mappedBy = "recipe", fetch = FetchType.LAZY)
    private List<WeaponRecipeIngredient> ingredients;
}
