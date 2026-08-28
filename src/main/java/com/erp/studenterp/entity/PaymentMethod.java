package com.erp.studenterp.entity;

public enum PaymentMethod {

    UPI,
    CARD,
    NET_BANKING,
    CASH,

    /** Settled through the Razorpay checkout by the student themselves. */
    ONLINE
}
