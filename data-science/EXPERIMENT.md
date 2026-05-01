# Experiment 001 - Synthetic Drugstore Refill Prediction

Date: 2026-05-01

## Setup

Generated a synthetic German drugstore-style transaction dataset:

- 180 customers
- 12 months of transactions
- 22,539 transaction rows
- recurring categories such as toilet paper, laundry detergent, diapers, baby wipes, coffee, pet food, kitchen paper, soap, and cleaning spray

Supervised training examples:

- target: customer/category is bought again within the next 14 days
- temporal split: first 75% snapshots for training, later 25% for test
- 60,798 total examples
- 15,028 test examples
- test positive rate: 47.7%

## Result

Median interval baseline:

- ROC AUC: 0.925
- Average precision: 0.907
- Precision: 0.830
- Recall: 0.854
- F1: 0.842

Random forest scoring model:

- ROC AUC: 0.930
- Average precision: 0.927
- Precision: 0.834
- Recall: 0.854
- F1: 0.844

## Interpretation

The median refill baseline is already strong on recurring household categories. That is useful for the product strategy: a transparent predictor is not just a placeholder, it can already perform well for stable categories.

The ML model improves ranking quality, especially average precision. In a real retailer setting, this improvement could become larger when the model has access to richer signals:

- longer purchase history
- product taxonomy
- household segment or loyalty context, if explicitly available
- package size and quantity normalization
- promotion and coupon exposure
- seasonality
- user feedback outcomes

## Product Takeaway

For BaldLeer, the recommended path is:

1. Keep the mobile MVP explainable.
2. Use the median interval baseline as the first production-safe predictor.
3. Add an ML scoring layer only after opt-in feedback and real eBon outcomes are available.
4. Keep the UI explanation based on transparent signals, even if the ranking score comes from ML.
