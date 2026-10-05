# Update your local family tree

1. Open `family-tree.html` in Edge or Chrome and click **Edit family tree**. You can also double-click `edit-tree.html` in this folder.
2. Click **Add family member**, or search for someone and select their name to edit.
3. Fill in their details. Choose existing people under Parents, Partners or Children, then click the **Add** button beside that choice. You can add more than one parent, partner or child. To link two new people, add and apply the first person, then add the second.
4. Click **Apply changes**. Both sides of each relationship are updated automatically. Use **Undo last change** to reverse an applied change. **Cancel edits** discards only the unapplied form edits.
5. Click **Preview tree** to check your draft, including ancestor and descendant views.
6. Click **Save website files** and choose this folder: `C:\Website\steve-life-site\webpages\family-tree`. Your browser will ask for access to the folder. The editor updates `family-tree.html`, `family-data.json` and `edit-tree.html`.
7. Refresh your local `family-tree.html` to see the saved result. Commit and push the changed files to GitHub using your usual method.

If direct folder saving is unavailable, click **Download website files**. Allow multiple downloads if requested, then replace all three downloaded files in this folder. Keep their exact filenames; your browser may add `(1)` when older downloads exist.

## Drafts and backups

Applied changes are stored as a draft in the browser. Reopen the editor in the same browser and use **Restore draft** to continue. Unapplied form edits must be applied before they become part of the draft. Browser drafts are not website files and are not included in a GitHub push.

**Download previous records** downloads a backup of the records before your most recent change or save. **Open saved tree** can load a saved `family-tree.html` or a downloaded backup. Keep important backups outside the website folder. Browser backups may disappear if browser storage is cleared; download one when you want a lasting copy.

The editor checks that the selected folder contains the same records you started from before saving. If the files have changed elsewhere, download your draft to keep a copy, then use **Open saved tree** to load the latest version.

## What goes into GitHub

Include `edit-tree.html`, `edit-tree.js`, `family-tree.html`, `family-data.json` and this guide on the first push. Later record edits normally change only the three files saved by the editor.

The editor works on your local computer. It is not a login system or an online editing service. The public website continues to show the saved tree. Dates of birth and death details for living people are omitted from saved records, matching the existing public tree.

This editor maintains the website's records directly. It does not update the original GEDCOM files or the separate FamilyTree source project. Rebuilding this website from those original GEDCOM exports would replace local additions, so retain a copy of your saved website files before doing that.
