# Updating Lowry Lab

This project is already connected to Render through GitHub.

1. Replace/update the files in the same GitHub application directory that Render currently uses as its **Root Directory**.
2. Commit the changes to the linked branch (normally `main`).
3. If Render **Auto-Deploy** is set to **On Commit**, Render automatically builds and deploys that commit. No manual deploy is needed.
4. Watch the Render Deploys page if you want to see progress.

Do not change the Render Root Directory unless you also move `package.json` and `server.js` to a different folder in GitHub.
