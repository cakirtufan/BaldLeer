# BaldLeer Data Science Spike

This folder tests how a small ML scoring layer could behave on transaction history.

The mobile app stays local and explainable. This spike is separate from the app and is meant for partner/product conversations:

1. Start with transparent refill logic in the app.
2. Build supervised examples from transaction history.
3. Predict whether a customer/category is likely to be bought again in the next 14 days.
4. Compare the ML model against the current median-interval baseline.

## Run with Synthetic Drugstore Data

```bash
python data-science/generate_sample_retail.py
python data-science/train_refill_model.py --input data-science/data/sample_drugstore_transactions.csv
```

## Run the One-User Personal Experiment

This is the more product-relevant experiment for BaldLeer:

```bash
python data-science/generate_personal_timeline.py
python data-science/train_personal_refill_model.py
```

It creates one user's 12-month purchase history plus a hidden 3-month future and evaluates whether a model trained only on that user's history can predict future refill needs.

Read the result summary in:

```text
data-science/PERSONAL_EXPERIMENT.md
```

The script writes a metrics JSON to:

```text
data-science/outputs/refill_model_metrics.json
```

## Run with Real Export or UCI-like CSV

The training script expects columns equivalent to:

- `customer_id`
- `invoice_id`
- `invoice_date`
- `product_name`
- `category`
- `quantity`
- `unit_price`

It also accepts common UCI Online Retail names and normalizes them:

- `CustomerID`
- `InvoiceNo`
- `InvoiceDate`
- `Description`
- `Quantity`
- `UnitPrice`

For UCI data there is no true drugstore category, so the script maps descriptions into coarse categories. For a real dm/Rossmann export, category mapping should come from the retailer product taxonomy.

## Model Framing

Prediction target:

> Will this customer buy this category again in the next 14 days?

Features:

- days since last purchase
- median interval
- average interval
- interval variability
- purchase count
- total quantity
- total spend
- month
- weekday
- category

Models:

- Baseline: median refill interval
- ML: random forest classifier

Metrics:

- ROC AUC
- average precision
- precision
- recall
- F1

This is not production ML. It is a fast spike to understand whether historical purchase data contains enough signal for better refill suggestions.
