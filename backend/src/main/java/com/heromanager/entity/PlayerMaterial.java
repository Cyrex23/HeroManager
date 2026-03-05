package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "player_material",
       uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "material_template_id"}))
@Getter @Setter @NoArgsConstructor
public class PlayerMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_template_id", nullable = false)
    private MaterialTemplate materialTemplate;

    @Column(nullable = false)
    private int quantity = 0;
}
