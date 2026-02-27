package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "team_setup", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"player_id", "setup_index"})
})
@Getter
@Setter
@NoArgsConstructor
public class TeamSetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "setup_index", nullable = false)
    private int setupIndex;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(name = "is_active", nullable = false)
    private boolean active = false;
}
