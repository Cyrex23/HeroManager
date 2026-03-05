package com.heromanager.dto;

public record MaterialResponse(
    Long id,
    String name,
    String iconKey,
    int tier,
    String category,
    int quantity
) {}
