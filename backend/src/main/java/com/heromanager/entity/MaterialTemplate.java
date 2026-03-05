package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "material_template")
@Getter @Setter @NoArgsConstructor
public class MaterialTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 50)
    private String iconKey;

    @Column(nullable = false)
    private int tier;

    @Column(length = 50)
    private String category;

    private String description;
}
