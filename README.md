# BaldLeer / Smart Refill

You know that moment when you come back from the drugstore, put the bags on the table, and realize: *I forgot the one thing I actually needed.*

Toilet paper. Detergent. Baby wipes. Toothpaste. Coffee. Pet food. These products are easy to forget, but they are also quite predictable. Most households buy them again and again in a similar rhythm.

`BaldLeer` is a mobile MVP prototype for this situation.

It explores how an existing retailer app could use digital receipts and purchase history to suggest products that may soon be needed again. The user does not scan receipts and does not manually track products. The feature works with the purchase history that already exists in the retailer profile, after the user has opted in.

## Example use case

Before going shopping, the user opens the retailer app.

In addition to **Meine Einkäufe**, the app shows a small section called **BaldLeer**.

There, the user might see:

> **Toilettenpapier**  
> Du kaufst diese Kategorie ungefähr alle 31 Tage.  
> Dein letzter Kauf war vor 28 Tagen.  
> Könnte bald wieder nötig sein.

The user can then add the item to the shopping list or cart. If the suggestion is wrong, they can simply answer **Noch genug**, **Schon gekauft**, or **Nicht relevant**.

This feedback is part of the idea. The feature should not behave like a pushy reminder system. It should learn from small corrections and become more useful over time.

## What is inside this prototype?

The prototype is more than a static mock-up. It includes a small prediction engine that works on simulated eBon purchase history.

The app uses:

- recurring purchase detection based on past digital receipts
- category-level and product-level refill predictions
- median-based refill interval estimation
- urgency classification such as **Bald nötig** or **Überfällig**
- confidence labels such as **Niedrig**, **Mittel**, and **Hoch**
- feedback handling for **Noch genug**, **Schon gekauft**, and **Nicht relevant**
- simple stock-up detection, for example when the user buys more than usual during a promotion
- local demo profiles for different household situations

The prediction logic is intentionally explainable. Instead of showing a black-box recommendation, the app can tell the user why a product appears:

> “Du kaufst diese Kategorie ungefähr alle 31 Tage. Der letzte Kauf war vor 28 Tagen.”

This is important for trust. The suggestion should feel helpful, not creepy.

## How to run it

You need Node.js and npm installed on your machine.

Clone the repository:

```bash
git clone https://github.com/cakirtufan/BaldLeer.git
cd BaldLeer
npx expo start --port 8083 --localhost --clear
