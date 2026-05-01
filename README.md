# BaldLeer / Smart Refill

You know that moment when you come back from the drugstore, put the bags on the table, and realize: *I forgot the one thing I actually needed.*

Toilet paper. Detergent. Baby wipes. Toothpaste. Coffee. Pet food. These products are easy to forget, but they are also quite predictable. Most households buy them again and again in a similar rhythm.

`BaldLeer` is a mobile MVP prototype for this situation.

It explores how an existing retailer app could use digital receipts and purchase history to suggest products that may soon be needed again. The user does not scan receipts and does not manually track products. The feature works with purchase history that already exists in the retailer profile, after the user has opted in.

The prototype is designed for a German drugstore context such as dm or Rossmann, without using official branding or any real retailer integration.

## Product idea

Many retailer apps already have a section like **Meine Einkäufe** or digital eBons. Today, that area is mostly passive: it shows what the user bought in the past.

`BaldLeer` turns that history into a practical refill assistant.

Before going shopping, the user opens the retailer app and sees a small **BaldLeer** module:

> **Toilettenpapier**  
> Du kaufst diese Kategorie ungefähr alle 31 Tage.  
> Dein letzter Kauf war vor 28 Tagen.  
> Könnte bald wieder nötig sein.

The user can add the item to a shopping list or a simulated cart. If the suggestion is wrong, they can answer **Noch genug**, **Schon gekauft**, or **Nicht relevant**.

The tone is intentionally soft. The app does not claim that something is empty. It says things like:

- könnte bald wieder nötig sein
- wahrscheinlich bald wieder relevant
- basierend auf deinen bisherigen Einkäufen
- du kaufst diese Kategorie ungefähr alle X Tage

## Why this matters for a retailer

`BaldLeer` makes existing first-party purchase history more useful without creating a separate shopping-list product.

For a retailer, the feature can:

- increase the value of digital receipts and the customer account
- create a practical reason to reopen the app before a store visit
- support repeat purchases without feeling pushy
- connect later to coupons, online cart, reminders, and loyalty mechanics
- keep the experience inside the retailer app instead of a generic external list

## What is inside this prototype?

The app is a working Expo / React Native prototype, not a static mock-up.

It includes:

- simulated digital eBon purchase history
- basket-style receipts with multiple line items
- category and product-level refill suggestions
- urgency labels such as **Bald nötig**, **Wahrscheinlich nötig**, and **Überfällig**
- confidence labels such as **Niedrig**, **Mittel**, and **Hoch**
- shopping list and simulated cart actions
- feedback handling for **Noch genug**, **Schon gekauft**, and **Nicht relevant**
- stock-up detection for larger or promotion-driven purchases
- local demo profiles for different household situations

The app keeps the prediction logic explainable. Instead of showing a black-box recommendation, it can tell the user why a product appears:

> "Du kaufst diese Kategorie ungefähr alle 31 Tage. Der letzte Kauf war vor 28 Tagen."

This is important for trust. The suggestion should feel helpful, not creepy.

## Demo profiles

The prototype includes multiple local demo profiles:

- **Familie mit Kleinkind**: baby products, wipes, household supplies, seasonal and promotion effects
- **Single-Haushalt**: personal care, coffee, toothpaste, less frequent household refills
- **Haustierbesitzer**: pet food, cleaning supplies, kitchen paper, recurring household needs

Switching profiles resets local demo data and recalculates suggestions. This makes the app usable in a live product conversation.

## How to run it

You need Node.js and npm installed.

```bash
npm install
npx expo start --port 8083 --localhost --clear
```

Then open the app in Expo Go, a simulator, or the local web preview.

Useful checks:

```bash
npm run typecheck
npm run test
```

## Technical shape

The mobile app uses:

- Expo
- React Native
- TypeScript
- Expo Router
- AsyncStorage for local persistence
- pure TypeScript domain logic
- Vitest unit tests

There is no backend, login, cloud sync, payment, OCR, scraping, or real dm/Rossmann API integration.

## Prediction approach

The current app uses an explainable personal refill logic:

1. Group purchases by normalized category and product.
2. Detect repeated purchases.
3. Estimate the usual interval using the median between purchase dates.
4. Adjust the estimate when the last purchase looks like a stock-up.
5. Apply user feedback such as **Noch genug** or **Nicht relevant**.
6. Score and sort suggestions by urgency, confidence, and explanation signals.

This gives a strong baseline that is easy to explain in the UI and easy to challenge with feedback.

## Evaluation notes

The repository also contains a small `data-science/` spike. Its purpose is not to make the app look like an ML product. It is there to test whether a future scoring layer could improve ranking once more real opt-in purchase data is available.

Two benchmarks are currently supported:

- synthetic one-user timeline with a hidden future period
- local Rossmann eBon PDFs parsed from the PDF text layer

The current takeaway is balanced:

- the median interval baseline is strong and explainable
- on synthetic data, the baseline still performs best overall
- on the local Rossmann receipts, ML shows better ranking signal, but the dataset is still too small and sparse to replace the baseline
- the best product direction is hybrid: keep explainable refill logic in the app, and later use ML as a ranking layer after enough opt-in data and feedback outcomes exist

Run the local receipt benchmark with:

```bash
python data-science/extract_rossmann_receipts.py
python data-science/train_personal_refill_model.py --history data-science/data/rossmann_history_9m.csv --future data-science/data/rossmann_future_3m.csv --output data-science/outputs/rossmann_refill_metrics.json --user-label ROSSMANN_RECEIPT_USER --exclude-categories other
```

Derived CSV and JSON benchmark files are ignored by git.

## Privacy and scope

This MVP stores app data locally and uses mock/demo data in the mobile experience. No data is sent to a server.

In a real retailer app, purchase-history-based suggestions would need:

- explicit opt-in
- transparent explanation of how purchase history is used
- clear controls to disable suggestions
- easy suppression of irrelevant categories
- careful handling of sensitive household signals

The prototype should be read as a product and interaction concept, not as an official dm or Rossmann app.
