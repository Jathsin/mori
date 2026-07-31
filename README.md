# Stoic Gift

A minimal native SwiftUI life calendar for two people.

- Coral begins on 15 January 2005.
- Blue begins on 26 May 2005.
- The colors become plum from 14 November 2024 through today.
- Future weeks remain outlined.

## Open and run

Open `StoicGift.xcodeproj` in Xcode.

- Choose **StoicGift iOS**, select an iPhone simulator, and press **Run**.
- Choose **StoicGift macOS**, select **My Mac**, and press **Run**.

Both targets share the calendar and date logic. You can run the Mac app and
iPhone Simulator at the same time.

The date calculations use the current day automatically, so the shared section grows over time.

## Web version

The GitHub Pages version lives in [`web`](web). It uses Go and templ to generate
a fully static site, with HTMX available locally and no external runtime
dependencies. The generated page is written to `web/dist`.

The included `.github/workflows/pages.yml` workflow builds and publishes the
site through GitHub Pages.
