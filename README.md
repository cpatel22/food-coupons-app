# Food Coupons App

This is a mobile-friendly food ordering solution built with **Next.js** and **Bun.js**.

## Features

- **Food Menu**: Browse items with images and prices.
- **Cart**: Add items, adjust quantities, and view total price.
- **Checkout**: Simulates a checkout process.
- **Printable Coupons**: Generates tearable coupons formatted for 58mm thermal printers.

## Getting Started

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Run the development server**:
   ```bash
   bun dev
   ```

3. **Open the app**:
   Visit [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

## Printing Coupons

After checking out, you will see a receipt view. Click "Print Coupons" to open the browser's print dialog. The layout is optimized for 58mm thermal printers, but will also print clearly on standard paper.

## Project Structure

- `pages/`: Application routes and API endpoints.
- `components/`: UI components (MenuItem, Cart, CouponReceipt).
- `data/`: Static data (menu items).
- `styles/`: Global styles.
