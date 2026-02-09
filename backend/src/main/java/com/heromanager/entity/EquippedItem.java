package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "equipped_item", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"heroId", "slotNumber"}),
    @UniqueConstraint(columnNames = {"heroId", "itemTemplateId"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EquippedItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long heroId;

    @Column(nullable = false)
    private Long itemTemplateId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "itemTemplateId", insertable = false, updatable = false)
    private ItemTemplate itemTemplate;

    @Column(nullable = false)
    private Integer slotNumber;
}
