# Personal Experiment - One User History + Three-Month Future

Date: 2026-05-01

## Why This Experiment Exists

The previous spike was closer to a retailer-level model: many customers, many baskets, one model. That is useful later, but it does not answer the first product question for BaldLeer:

> Given one user with one year of messy purchase history, can we predict their next three months of refill needs?

This experiment uses exactly that framing.

## Synthetic Data Setup

Generated one family-with-toddler persona:

- 12 months of historical purchases
- 3 months of hidden future purchases
- messy baskets with multiple line items per eBon
- brand switching within the same category
- skipped purchases
- stock-up behavior
- coupon/promotion flags
- future baby-product discount window
- seasonal sunscreen behavior
- one-off noise purchases such as cosmetics, gifts, home items

Generated files:

- `data-science/data/personal_history_12m.csv`
- `data-science/data/personal_future_3m.csv`
- `data-science/data/personal_full_15m.csv`

These generated CSV files are ignored by git because they are reproducible artifacts.

## Model Framing

Train:

- only the user's 12-month history
- weekly category-level snapshots
- target: category bought again in the next 14 days

Evaluate:

- rolling snapshots over the next 3 months
- future purchases become known only after they happen

Models:

- baseline: median refill interval
- explainable hybrid: median interval plus stock-up, promotion, seasonality, and interval-stability adjustments
- personal ML: logistic regression with category, interval, stock-up, promotion, coupon, quantity, spend, and seasonality features
- median + ML ensemble: normalized median score blended with personal ML probability

## Current Result

History rows: 180
Future rows: 43
Train examples: 607
Test examples: 176
Future positive rate: 38.1%

Median interval baseline:

- ROC AUC: 0.677
- Average precision: 0.540
- Precision: 0.523
- Recall: 0.672
- F1: 0.588

Explainable hybrid rules:

- ROC AUC: 0.656
- Average precision: 0.517
- Precision: 0.506
- Recall: 0.657
- F1: 0.571

Personal logistic model:

- ROC AUC: 0.658
- Average precision: 0.598
- Precision: 0.522
- Recall: 0.537
- F1: 0.529

Median + ML ensemble:

- ROC AUC: 0.659
- Average precision: 0.598
- Precision: 0.537
- Recall: 0.537
- F1: 0.537

## Interpretation

The personal ML model ranks likely refill events better by average precision, but it does not beat the median baseline on F1 or ROC AUC in this one-user setup. The rule-based hybrid is more product-explainable, but it also shows the risk of over-adjusting a strong baseline.

That is a useful product insight, not a failure:

- one user has limited training examples
- refill behavior is sparse and category-specific
- median interval remains a strong, explainable baseline
- ML can help ranking, but should not replace transparent rules too early
- stock-up and seasonality adjustments should be validated instead of assumed to improve every metric

## Product Recommendation

For BaldLeer, the better near-term architecture is hybrid:

1. Use median interval as the default personal predictor.
2. Keep stock-up, seasonality, and feedback as explainable modifiers.
3. Prefer explainability in the mobile UI.
4. Use ML-derived probability as a ranking signal only after enough opt-in feedback exists.
5. Train stronger models only when many opt-in users and feedback outcomes exist.

For a real partner pilot, the next experiment should compare:

- personal-only baseline
- personal-only ML
- retailer-level pretrained ML
- hybrid personal baseline + retailer-level score

The likely production winner is the hybrid model, not a standalone model trained from only one user's history.
