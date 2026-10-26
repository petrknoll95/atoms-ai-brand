# Shared guideline feedback

Pindrop.js 0.1.30 is lazy-loaded from the shared Guide layout. Firebase project
`atomsai-guideline-feedback` uses the Spark plan and Firestore Standard in
`europe-west3` (Frankfurt). Analytics and Gemini were not enabled during setup.

## Visitor flow

Open **Feedback**, choose Comment, click any page element, enter a display name,
and send. Firebase creates an anonymous identity without a login screen. Threads
and replies sync through Firestore. The UI reports saving/failure and offers retry;
closing a page with unsaved writes triggers a browser warning. A display name is
not verified identity. Clearing browser storage loses ownership of past comments.

The public web app config lives in `src/data/firebase.ts`. It is not a server secret.
Never add an Admin SDK key or service-account credential to the client.

## Data and access

- `pages/{encoded pathname}/comments/{commentId}`: one document per pin.
- `pages/{encoded pathname}/replies/{replyId}`: one document per reply.
- Local preview scopes start with `preview:` so test notes do not appear on the live site.
- Queries require an anonymous Firebase identity. These are public guideline review
  threads, not private conversations; anyone visiting the site can read them.
- Guests may edit/delete only their own entries. Any guest can resolve/reopen a thread.
- Rules validate field names, payload types, and text lengths. Other collections are denied.
- Edits write only changed fields; new replies never replace another guest's reply array.
- Firestore rules are in `firestore.rules`. Publish this file in Firebase Console →
  Firestore → Rules after any rules change. Site deployment does not deploy these rules.
- Project administrators can moderate through the Firebase console.

Anonymous access does not prevent automated spam. Spark usage is quota-limited;
App Check/abuse protection can be added if this review site receives abuse.
No billing upgrade is required for this integration.

## Verify

`npm run check` and `npm run build` validate the site.
Run a production preview at port 4330, then `npm run test:feedback` to exercise
independent guests, pins, replies, reloads, and page isolation. Override
`FEEDBACK_TEST_URL` for another preview address. Browser tests create clearly
named verification notes in the preview scope; do not target production for tests.

`npm run test:feedback-rules` checks the deployed rules using temporary isolated
verification documents and cleans up the documents it creates. It verifies guest
reads/replies, concurrent reply writes, ownership, input limits, and denied unauthenticated access.
