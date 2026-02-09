package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hero", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"playerId", "templateId"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Hero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private Long templateId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "templateId", insertable = false, updatable = false)
    private HeroTemplate template;

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer currentXp = 0;

    @Column(nullable = false)
    private LocalDateTime acquiredAt;

    @PrePersist
    protected void onCreate() {
        if (acquiredAt == null) {
            acquiredAt = LocalDateTime.now();
        }
    }
}
