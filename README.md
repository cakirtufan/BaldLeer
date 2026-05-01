# Bald leer? / Smart Refill

Pitchable mobile MVP prototype for a German retail drugstore context. The prototype shows how an existing retailer app could turn **Meine Einkäufe** and digital eBon history into a useful, opt-in refill assistant.

## Product Idea

`Bald leer?` transforms purchase history from a passive archive into an active service moment. The user does not scan receipts and does not enter products manually. Instead, the feature assumes that the retailer already has digital receipts and purchase history in the customer profile.

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

Today, **Meine Einkäufe** is mostly a record of what already happened. `Bald leer?` makes that same history actionable:

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

This is designed for live partner conversations: switching profiles immediately changes the story from baby products to single-household care products or pet-owner refill patterns.

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
