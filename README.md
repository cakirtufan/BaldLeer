# Bald leer? / Smart Refill

Mobile MVP prototype for a German retail drugstore context. The prototype shows how an existing retailer app could turn **Meine Einkäufe** and digital eBon history into soft, predictive refill suggestions.

## Product Idea

`Bald leer?` analyzes recurring purchases already stored in a simulated retailer profile and suggests products or categories that may soon be needed again. It deliberately avoids receipt scanning, OCR, scraping, login, cloud sync, real payments, and real dm/Rossmann integrations.

Main UX language is German and uses soft wording such as:

- könnte bald leer sein
- wahrscheinlich bald wieder nötig
- basierend auf deinen bisherigen Einkäufen
- du kaufst diese Kategorie ungefähr alle X Tage

## Business Value

For a retailer, the feature can make existing digital receipt history more useful:

- turns passive purchase archives into an active refill assistant
- increases convenience and repeat purchase intent
- creates a path to optional cart, coupon, and reminder integrations
- keeps the experience inside the retailer app rather than a generic shopping list

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

## Demo Profiles

The demo screen resets all local data and switches between:

- Familie mit Kleinkind
- Single-Haushalt
- Haustierbesitzer

Each profile has a different six-month purchase history and refill pattern.

## Privacy Assumption

This MVP stores all data locally on the device. No data is sent to a server. In a real retailer app, this feature would require transparent communication, explicit opt-in, and clear controls for disabling purchase-history-based predictions.

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
