package com.heromanager.dto;

public record DailySpinResult(
    Long materialId,
    String name,
    String iconKey,
    int tier,
    int wonQty,
    long nextResetMs
) {}
