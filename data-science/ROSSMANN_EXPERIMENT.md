# Rossmann Receipt Experiment

Date: 2026-05-01

## Setup

This experiment uses locally provided Rossmann eBon PDFs from the `data/rossmann-receipts/` folder.

The parser:

- reads the PDF text layer with `pdftotext`
- extracts product line items, receipt date, store code, barcode, price, and promo marker
- maps abbreviated receipt product names into coarse refill categories
- excludes masked customer/card/payment details from the derived dataset

Generated files are ignored by git:

- `data-science/data/rossmann_receipts.csv`
- `data-science/data/rossmann_history_9m.csv`
- `data-science/data/rossmann_future_3m.csv`
- `data-science/outputs/rossmann_refill_metrics.json`

## Data Shape

- 21 eBon PDFs
- date range: 2025-05 to 2026-03
- 121 extracted product rows
- last three months used as future holdout
- broad `other` category excluded from scoring
- target: category bought again in the next 14 days

## Current Result

| Approach | ROC AUC | Avg precision | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Median interval baseline | 0.548 | 0.183 | 0.200 | 0.667 | 0.308 |
| Explainable hybrid rules | 0.538 | 0.181 | 0.200 | 0.667 | 0.308 |
| Personal logistic ML | 0.690 | 0.326 | 0.200 | 0.222 | 0.211 |
| Median + ML ensemble | 0.687 | 0.336 | 0.200 | 0.222 | 0.211 |

## Interpretation

The real receipt data changes the story compared with the synthetic benchmark:

- ML has better ranking metrics (`ROC AUC`, `average precision`)
- median still has better recall and F1 under the current thresholding setup
- the receipt set is small and sparse, so the model is not production-ready
- broad categories and receipt-name normalization matter a lot

Product recommendation:

1. Keep the app's explainable median baseline.
2. Use stock-up, seasonality, and feedback as transparent modifiers.
3. Treat ML as a future ranking layer, not a replacement.
4. Collect more opt-in receipt and feedback outcomes before claiming ML superiority.
