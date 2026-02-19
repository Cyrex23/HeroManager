package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "equipped_item", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"heroId", "slotNumber"}),
    @UniqueConstraint(columnNames = {"heroId", "itemTemplateId"})
})
@Getter
@Setter
@NoArgsConstructor
public class EquippedItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long heroId;

    @Column(nullable = false)
    private Long itemTemplateId;

    @Column(nullable = false)
    private int slotNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "itemTemplateId", insertable = false, updatable = false)
    private ItemTemplate itemTemplate;
}
