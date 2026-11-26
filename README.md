# LOGOSMYF Christmas Party 2026

A single-page Christmas invitation hosted on GitHub Pages, with native HTML registration POSTs to Google Apps Script and a private Google Sheet. The site uses plain HTML, CSS and JavaScript.

## Preview

Serve the repository root with `python3 -m http.server 8000`. Open `http://localhost:8000/`. The invitation is readable without JavaScript. With motion enabled, scrolling opens the flap and lifts a short preview from the envelope. The full details sit below in normal page flow. The page attempts to play the supplied Jingle Bells MP3 on load. Guests can pause or start it using the record button, including when their browser blocks autoplay.

## Configure registration

The registration form uses the organiser-provided Apps Script endpoint in `index.html`. To set up a replacement deployment or a separate test environment, follow the steps below.

1. Open the intended private Google Sheet under the organiser account. Review the spreadsheet and Apps Script project time zones. Use **Asia/Kuala_Lumpur** for Malaysia event times. Sheet timestamps are stored as dates and displayed in the spreadsheet's configured time zone. Ask the organiser before changing an existing spreadsheet's time zone.
2. Open **Extensions → Apps Script**, copy [Code.gs](google-sheets/Code.gs), and run `setupRsvp` with the requested permissions. It creates or validates **Registrations 2026**, formats the headers and columns, and preserves the old **RSVPs** tab and existing rows.
3. Deploy a web app as the authorised organiser. Set **Execute as** to **Me** and **Who has access** to **Anyone** so participants can register without signing into Google. Keep the spreadsheet private. For an existing web app, update its deployment to a new script version. Editing the repository or saving a script file alone does not update a deployed web app.
4. Paste the authorised `https://script.google.com/macros/s/…/exec` URL into the registration form's `data-endpoint` in [index.html](index.html). Verify the return address in `WEBSITE_URL`.
5. Test first against a separate private test spreadsheet and deployment, including while signed out. Verify success, then check the actual sheet row. Test browser Back and resubmission with the same ID, and check that a public GET never returns responses.
6. After approval, verify **Settings → Pages** for the `logosmyf/christmas-rsvp` repository. Set it to deploy from the intended branch and root directory. The expected URL is https://logosmyf.github.io/christmas-rsvp/.

The site uses a native POST and the Apps Script confirmation page, so a network error cannot be interpreted as success. Guests can use browser Back to retry. The page keeps the attempt ID in browser history and relies on the browser to restore entered form values. The website does not save personal information in browser storage.

## Worksheet

**Registrations 2026** columns in order are Submitted at, Full Name, Contact Number, Food Name, Food Category, Wish 1, Wish 2, Wish 3, Additional Notes and Submission ID. The script writes the timestamp, treats phone numbers as text, maps category codes to Chinese labels, protects text from spreadsheet formulas, and deduplicates retries under a lock. The 12 December deadline is informational. Any future change to enforce it should update both the visible form state and the backend setting.
