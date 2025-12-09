# How to Clear LocalStorage

## Method 1: Browser Console (Recommended)

1. Open your browser's Developer Tools:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Safari**: Press `Cmd+Option+I` (Mac)

2. Click on the **Console** tab

3. Type this command and press Enter:
   ```javascript
   localStorage.clear()
   ```

4. You should see `undefined` returned (that's normal)

5. Refresh the page (F5 or Cmd+R)

## Method 2: Application Tab (Chrome/Edge)

1. Open Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, expand **Local Storage**
4. Click on your site's URL
5. Right-click and select **Clear** or click the **Clear All** button
6. Refresh the page

## Method 3: Clear Specific Key

If you only want to clear the draft state (not all localStorage):

```javascript
localStorage.removeItem('movie-draft-state')
```

Then refresh the page.

## Verify It Worked

After clearing and refreshing, the app should show the Setup Screen, and you can start a fresh draft.

