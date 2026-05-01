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

Compared approaches:

- median interval baseline
- explainable hybrid rules
- personal logistic ML
- median + ML ensemble

Read the result summary in:

```text
data-science/PERSONAL_EXPERIMENT.md
```

The script writes a metrics JSON to:

```text
data-science/outputs/personal_refill_metrics.json
```

## Run the Local Rossmann Receipt Benchmark

If a local `Rossmann/` folder with eBon PDFs exists, extract product rows and evaluate the last three months as a holdout:

```bash
python data-science/extract_rossmann_receipts.py
python data-science/train_personal_refill_model.py --history data-science/data/rossmann_history_9m.csv --future data-science/data/rossmann_future_3m.csv --output data-science/outputs/rossmann_refill_metrics.json --user-label ROSSMANN_RECEIPT_USER --exclude-categories other --framing "train on extracted Rossmann eBon history before the last 3 months, evaluate on the last 3 months; broad other category excluded"
```

The extractor reads the PDF text layer. It does not run OCR and does not copy masked customer/card/payment details into the derived CSV.

Current local result:

| Approach | ROC AUC | Avg precision | F1 |
| --- | ---: | ---: | ---: |
| Median interval baseline | 0.548 | 0.183 | 0.308 |
| Explainable hybrid rules | 0.538 | 0.181 | 0.308 |
| Personal logistic ML | 0.690 | 0.326 | 0.211 |
| Median + ML ensemble | 0.687 | 0.336 | 0.211 |

This says ML is promising as a ranking layer on the receipt data, but the thresholding and dataset size are not good enough to replace the explainable baseline.

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
- Explainable hybrid: median plus stock-up, promo, seasonality, and stability adjustments
- Personal ML: logistic regression classifier
- Median + ML ensemble: normalized median score blended with model probability

Metrics:

- ROC AUC
- average precision
- precision
- recall
- F1

This is not production ML. It is a fast spike to understand whether historical purchase data contains enough signal for better refill suggestions.
