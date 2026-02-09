package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "item_template")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ItemTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer cost;

    @Builder.Default
    private Double bonusPa = 0.0;

    @Builder.Default
    private Double bonusMp = 0.0;

    @Builder.Default
    private Double bonusDex = 0.0;

    @Builder.Default
    private Double bonusElem = 0.0;

    @Builder.Default
    private Double bonusMana = 0.0;

    @Builder.Default
    private Double bonusStam = 0.0;
}
