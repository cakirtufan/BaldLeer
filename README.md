# BaldLeer / Smart Refill

Pitchable mobile MVP prototype for a German retail drugstore context. The prototype shows how an existing retailer app could turn **Meine Einkäufe** and digital eBon history into a useful, opt-in refill assistant.

## Product Idea

`BaldLeer` transforms purchase history from a passive archive into an active service moment. The user does not scan receipts and does not enter products manually. Instead, the feature assumes that the retailer already has digital receipts and purchase history in the customer profile.

The MVP analyzes recurring purchases stored in a simulated retailer profile and suggests products or categories that may soon be needed again. It deliberately avoids receipt scanning, OCR, scraping, login, cloud sync, real payments, and real dm/Rossmann integrations.

Main UX language is German and uses soft wording such as:

- könnte bald leer sein
- wahrscheinlich bald wieder nötig
- basierend auf deinen bisherigen Einkäufen
- du kaufst diese Kategorie ungefähr alle X Tage

## Business Value

For a retailer, the feature makes existing first-party purchase history more useful without creating a separate shopping-list product:

- increases the perceived value of digital receipts and the customer account
- creates a practical reason to revisit the retailer app before the next store visit
- supports repeat purchase behavior with helpful, soft suggestions
- can connect later to coupons, online cart, reminders, and loyalty mechanics
- keeps the experience inside the retailer app rather than a generic standalone list

## Pitch Narrative

Today, **Meine Einkäufe** is mostly a record of what already happened. `BaldLeer` makes that same history actionable:

1. The app recognizes recurring household categories from eBon history.
2. It estimates usual refill intervals with robust median-based logic.
3. It shows soft suggestions such as “könnte bald wieder nötig sein”.
4. The user can add an item to a shopping list or simulated cart.
5. Feedback like “Noch genug” or “Nicht relevant” adjusts future suggestions.

The prototype is intentionally framed as a feature module that could live inside an existing German drugstore app.

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router tabs
- AsyncStorage local persistence
- Pure TypeScript prediction domain logic
- Vitest unit tests

## Run

```bash
npm install
npm run start
```

Then open the Expo app in a simulator, browser, or Expo Go-compatible environment.

For a local web pitch demo:

```bash
npx expo start --port 8083 --localhost --clear
```

## Prediction Logic

The pure function is:

```ts
calculateRefillPredictions(purchases, feedback, settings)
```

It:

- groups purchases by normalized category first
- also creates product-level predictions when enough repeated product purchases exist
- requires at least two purchases
- sorts purchases by date
- calculates intervals between purchases
- uses the median interval as the main estimate
- keeps the average interval for display/debugging
- estimates next purchase as `last purchase + median interval`
- classifies urgency from days until estimated next purchase
- classifies confidence from purchase count and interval variability
- exposes explainable prediction signals for the UI:
  - interval stability
  - data depth
  - feedback signal
  - stock-up signal
  - ML readiness
- adjusts the estimated refill date when the last purchase looks like a promo-driven stock-up
- calculates a recommendation score and reason codes instead of relying only on due date sorting

Urgency labels:

- Nicht dringend
- Bald nötig
- Wahrscheinlich nötig
- Überfällig

Confidence labels:

- Niedrig
- Mittel
- Hoch

## Feedback Logic

Feedback is stored locally and adapts future suggestions:

- `Zur Einkaufsliste` creates a shopping list item
- `In den Warenkorb` creates a simulated cart item
- `Noch genug` postpones the estimated next purchase date
- `Schon gekauft` creates a new purchase entry for today
- `Nicht relevant` suppresses future suggestions for that category/product

## ML-Ready Direction

The current MVP intentionally uses an explainable predictor instead of a black-box model. This is the right first step for a retail partner pitch because every suggestion can be explained to the user:

- usual purchase interval
- last purchase date
- interval stability
- confidence level
- feedback already considered

With real retailer data, this can evolve into a small prediction service. A practical supervised model would predict:

> probability that a category or product will be bought again in the next 7 or 14 days

Candidate model features:

- days since last purchase
- median and average refill interval
- interval variability
- purchase count over 3, 6, and 12 months
- household or segment proxy, if explicitly available
- package size and quantity
- stock-up behavior and quantity ratio
- product category
- weekday, month, and seasonal effects
- coupon or promotion exposure
- user feedback such as “Noch genug” or “Nicht relevant”

Recommended production approach:

1. Start with the explainable rule-based predictor.
2. Log opt-in feedback and suggestion outcomes.
3. Train an offline model on historical eBon data.
4. Use the model only as a scoring layer.
5. Keep the user-facing explanation based on transparent signals.

This keeps the feature credible for compliance, product, and data-science stakeholders.

## Personal Prediction Experiment

The repository includes a small data-science spike that compares the current median baseline against hybrid and ML approaches on a realistic synthetic split:

- one family-with-toddler persona
- 12 months of messy eBon history for training
- 3 months of hidden future purchases for evaluation
- weekly category-level snapshots
- target: whether a category is bought again in the next 14 days

Run it with:

```bash
python data-science/generate_personal_timeline.py --seed 7
python data-science/train_personal_refill_model.py
```

Current result on the generated split:

| Approach | ROC AUC | Avg precision | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Median interval baseline | 0.677 | 0.540 | 0.523 | 0.672 | 0.588 |
| Explainable hybrid rules | 0.656 | 0.517 | 0.506 | 0.657 | 0.571 |
| Personal logistic ML | 0.658 | 0.598 | 0.522 | 0.537 | 0.529 |
| Median + ML ensemble | 0.659 | 0.598 | 0.537 | 0.537 | 0.537 |

Interpretation:

- the median interval baseline remains hard to beat for one user's sparse refill history
- ML improves ranking quality (`average precision`) but does not yet improve F1 on this single-user setup
- hand-tuned hybrid rules can make the app more explainable, but they should be validated because extra adjustments can also hurt
- the most credible next step is not to replace the app logic with ML, but to use ML as a ranking signal once real opt-in feedback data exists

The detailed output is written to `data-science/outputs/personal_refill_metrics.json`.

## Stock-Up Aware Refill Logic

BaldLeer distinguishes between normal purchases and likely stock-up purchases. This matters because a promotion can distort purchase frequency:

> If a user buys two packs during a promotion, the next suggestion should usually move later, not fire at the normal interval.

The app-level predictor uses:

- last quantity
- usual quantity
- promo flag
- discount percent
- explicit stock-up flag in the mock data

If the last purchase is likely a stock-up, the estimated next purchase date is pushed back and the card explains:

- `Vorratskauf erkannt`
- adjusted refill interval
- extra days added because of the larger quantity

This keeps the demo explainable while reflecting the same behavior that a future ML model should learn from real eBon data.

## Scoring and Reason Codes

BaldLeer does not try to perfectly optimize every suggestion. It uses a transparent scoring layer so the product keeps room for retailer-specific tuning.

The score combines:

- urgency timing
- confidence
- stock-up adjustment
- category-level vs product-level prediction

Each prediction also carries reason codes:

- `recurring_interval`
- `stockup_adjusted`
- `feedback_postponed`
- `stable_history`
- `irregular_history`
- `low_data`
- `urgent_timing`
- `seasonal_relevance`

The UI turns these into user-facing explanations such as “wiederkehrender Bedarf”, “Vorratskauf berücksichtigt”, or “stabile Historie”. In a later pilot, an ML probability can become another scoring input without removing the explainable reason codes.

## Demo Profiles

The demo screen resets all local data and switches between:

- Familie mit Kleinkind
- Single-Haushalt
- Haustierbesitzer

Each profile has a different six-month purchase history and refill pattern.

This is designed for live partner conversations: switching profiles immediately changes the story from baby products to single-household care products or pet-owner refill patterns.

The demo data is intentionally story-driven:

- family profile shows stable baby needs, stock-up adjusted paper goods, and feedback-postponed detergent
- single profile shows coffee stock-up, product switching in care categories, and one suppressed category
- pet profile shows highly regular pet food, household companion categories, and cleaner feedback

The underlying mock purchases are defined as eBon baskets, not as isolated single-item events. Each receipt can contain multiple line items, so seasonality, stock-up behavior, companion products, and noise purchases are represented closer to a real shopping trip. The UI still renders the line items under “Meine Einkäufe”, but the source data is basket-based.

This makes the prediction cards demonstrate different reason codes instead of showing the same interval explanation repeatedly.

## Privacy Assumption

This MVP stores all data locally on the device. No data is sent to a server. In a real retailer app, this feature would require transparent communication, explicit opt-in, and clear controls for disabling purchase-history-based predictions.

The prototype includes settings and privacy copy to make the compliance assumption visible: purchase-history-based suggestions should be voluntary, explainable, and easy to turn off.

## MVP Limitations

- mock data only
- no backend
- no authentication
- no cloud sync
- no real retailer API
- no OCR or receipt scanning
- no payment or real cart checkout
- no official dm/Rossmann branding

## Future Extensions

- integration with digital receipts/eBon
- coupon personalization
- online cart integration
- push reminders
- household size adjustment
- optional receipt scanning as fallback
- backend integration
- A/B testing for suggestions

## Checks

```bash
npm run typecheck
npm run test
```
