# Update the GitHub website to v2.1.0

This folder is designed to be copied over the existing local repository for:

`https://github.com/Serofix-code/new-bitlife`

## Website update

1. Extract the update ZIP.
2. Copy everything inside it into the existing local `new-bitlife` repository folder.
3. Choose **Replace files in the destination**.
4. Open PowerShell in the repository folder.
5. Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\PUSH_UPDATE.ps1
```

The included GitHub Actions workflow runs the tests and updates the public GitHub Pages site after the push.

## Wiki update

The game now contains `guide.html`, which is automatically deployed with the website.

To also publish the repository’s separate GitHub Wiki:

1. Read `WIKI_SETUP.md`.
2. Initialize the Wiki tab once on GitHub.
3. Run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\PUSH_WIKI.ps1
```
