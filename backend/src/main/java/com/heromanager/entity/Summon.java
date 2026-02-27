package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "summon", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"playerId", "templateId"})
})
@Getter
@Setter
@NoArgsConstructor
public class Summon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private Long templateId;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private int currentXp = 0;

    @Column
    private Integer capacityOverride;

    @Column(nullable = false)
    private LocalDateTime acquiredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "templateId", insertable = false, updatable = false)
    private SummonTemplate template;

    @PrePersist
    protected void onCreate() {
        acquiredAt = LocalDateTime.now();
    }
}
