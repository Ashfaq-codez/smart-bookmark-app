# The inntoit iPhone Shortcut (Share Sheet)

This is how a link shared from any iPhone app (Reddit, Medium, Substack, Instagram, X, Safari…) is saved to inntoit with the **same content as a right-click save in Chrome**.

## Why the phone downloads the page

Some sites refuse requests from cloud servers like Vercel, where inntoit runs, but never refuse a phone:

- **Reddit** sometimes won't tell our server where a share link (`reddit.com/r/…/s/…`) leads.
- **Medium** (also on its own domains, like `ai.plainenglish.io`) answers servers with "403 Forbidden".
- **LinkedIn** and **Instagram** sometimes show servers a login page.

So the Shortcut does two small things on the phone before it sends the link:

1. **Expand URL** follows short and share links to the real post.
2. **Get Contents of URL** downloads the post page the way your phone sees it.

The server only reads that page's details (title, author, picture, post address). Each detail is checked, and it's used only when the server couldn't read the page itself. Nothing from it is ever shown as-is.

## The Shortcut, step by step

Open the **Shortcuts** app and edit your inntoit Shortcut (or make a new one). Then add these actions in this order.

1. **Receive** `URLs` and `Text` from **Share Sheet**.
   In the Shortcut's details (the ⓘ button), turn on **Show in Share Sheet**.
2. **Get URLs from Input** (search "Get URLs").
3. **Get Item from List**, set to **First Item** (the first link shared).
4. **Expand URL** (search "Expand"). Its input is the item from step 3.
5. **Get Contents of URL**.
   - URL: **Expanded URL** (from step 4)
   - Method: **GET** (the default; leave headers empty)
6. **Get Text from Input**. Its input is **Contents of URL** from step 5.
   *(The page as text.)*
7. **Get Contents of URL** again. This one saves to inntoit.
   - URL: `https://smart-bookmark-app-lime.vercel.app/api/save`
   - Method: **POST**
   - Headers: add `x-api-key` with your inntoit API key as the value (see "Your API key" below).
   - Request Body: **JSON**, with two text fields:
     - `url` → **Expanded URL** (from step 4)
     - `page_html` → **Text** (from step 6)
8. **Show Notification** with the text "Saved to inntoit".
   *(Optional: use **Get Dictionary Value** "error" from step 7's answer to show an error message instead.)*

That's it. A link without a page (for example, if step 5 fails because you're offline) is still saved as before.

## Your API key

Make the key in inntoit: open your **profile menu** (top right) and tap **New iOS Shortcut Key**, then copy it. inntoit shows it only once. Making a new key stops the old one, so your Shortcut needs the new one.

- **Don't type the key into a Shortcut you plan to share.** Use an **Import Question** instead: in the Shortcut's details, add an import question for the `x-api-key` header value. Anyone who adds the Shortcut then pastes their own key.

## When something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `401` / "Invalid API Key" | The key is wrong or was deleted | Make a new key in inntoit and paste it into step 7 |
| `413` / "Note is too long" | A shared text note is too long | Share a shorter piece of text |
| `429` / "Too many saves" | More than the per-minute limit | Wait a minute and share again |
| `409` / "Already saved" | That post is already in inntoit | Nothing to do |

## Test it

Share a Reddit post from the Reddit app. On the dashboard you should get the Reddit card with the post's text or picture, and its address should be `reddit.com/r/…/comments/…`, not `/s/…`. Then share a Medium article from the Medium app; you should get the Medium card with the author and reading time.
