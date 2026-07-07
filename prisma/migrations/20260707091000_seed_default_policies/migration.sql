INSERT INTO "Policy" (
    "id", "title", "publishedTitle", "slug", "content", "publishedContent",
    "status", "publishedAt", "createdAt", "updatedAt"
)
VALUES
(
    'policy_delivery',
    'Delivery Policy',
    'Delivery Policy',
    'delivery-policy',
    E'This delivery policy is placeholder content and should be reviewed before launch.\n\nInside Dhaka delivery charge is ৳70. Outside Dhaka delivery charge is ৳120.\n\nInside Chattogram delivery charge is ৳60. Outside Chattogram delivery charge is ৳120.\n\nCourier and tracking details are provided after dispatch when available.',
    E'This delivery policy is placeholder content and should be reviewed before launch.\n\nInside Dhaka delivery charge is ৳70. Outside Dhaka delivery charge is ৳120.\n\nInside Chattogram delivery charge is ৳60. Outside Chattogram delivery charge is ৳120.\n\nCourier and tracking details are provided after dispatch when available.',
    'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'policy_payment',
    'Payment Policy',
    'Payment Policy',
    'payment-policy',
    E'This payment policy is placeholder content and should be reviewed before launch.\n\nCustomers may choose Cash on Delivery, manual bKash, manual Nagad, or manual Rocket where available.\n\nManual mobile payments require a transaction ID and remain pending until verified by an administrator.',
    E'This payment policy is placeholder content and should be reviewed before launch.\n\nCustomers may choose Cash on Delivery, manual bKash, manual Nagad, or manual Rocket where available.\n\nManual mobile payments require a transaction ID and remain pending until verified by an administrator.',
    'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'policy_return',
    'Return Policy',
    'Return Policy',
    'return-policy',
    E'This return policy is placeholder content and should be reviewed before launch.\n\nReturns may be accepted for damaged, incorrect, or missing books when reported promptly after delivery.\n\nPlease keep the invoice or order number when contacting support. Refunds, replacements, and return delivery arrangements are handled by the publication team.',
    E'This return policy is placeholder content and should be reviewed before launch.\n\nReturns may be accepted for damaged, incorrect, or missing books when reported promptly after delivery.\n\nPlease keep the invoice or order number when contacting support. Refunds, replacements, and return delivery arrangements are handled by the publication team.',
    'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    'policy_privacy',
    'Privacy Policy',
    'Privacy Policy',
    'privacy-policy',
    E'This privacy policy is placeholder content and should be legally reviewed before launch.\n\nWe use account, order, delivery, and payment-reference information to provide the services requested by customers. Passwords are stored as secure hashes.\n\nOptional personalization may use book interactions such as views, cart activity, sample opens, and purchases. Customers can change their preferences or contact the publication team to request correction or deletion of account data.\n\nWe do not expose draft policy content to public visitors.',
    E'This privacy policy is placeholder content and should be legally reviewed before launch.\n\nWe use account, order, delivery, and payment-reference information to provide the services requested by customers. Passwords are stored as secure hashes.\n\nOptional personalization may use book interactions such as views, cart activity, sample opens, and purchases. Customers can change their preferences or contact the publication team to request correction or deletion of account data.\n\nWe do not expose draft policy content to public visitors.',
    'published', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;
