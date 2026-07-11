# Publish the GitHub Wiki

The update includes a `wiki` folder and `PUSH_WIKI.ps1`.

## First time only

1. Open the GitHub repository.
2. Open **Settings** and make sure **Wikis** is enabled under repository features.
3. Open the repository's **Wiki** tab.
4. Create the first page and save it. This initializes the separate wiki Git repository.

## Publish these pages

Open PowerShell inside the local repository and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\PUSH_WIKI.ps1
```

Git may open a browser for authentication. The script clones the wiki repository, copies the Markdown pages, commits them, and pushes them.

The public game also includes `guide.html`, so the same guide is available directly from the in-game menu even when the GitHub Wiki has not been initialized.
