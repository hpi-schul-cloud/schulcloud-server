# Git
## Branch name conventions

- Each change should be done in a ticket (no matter how small)
    - The ticket does not need to be refined for very small things
    - Might be relevant for reporting later
- Folder (feature/..) should no longer be used
- Stay below 64 letters
    - Do not simply use ticket title, usually we need a shorter description :-)
- Ticket number needs to be uppercase (*BC*-1234)
    - Related to matching with Jira
    - Careful: namespace is lowercase

```
BC-XXXX-kebab-case-short-description
```

## Commit message conventions

- Squashed commit subject should start with a ticket number, and end with a PR number
- Clean body (contains all commits by default)
    - Only leave changes relevant for main
    - Remove commits likes 'fix for linter', 'add tests', 'fix review comments'
    - See example below
- Write commit messages in imperative and active
    - Good: "make the code better"
    - Bad: "made the code better", "makes the code better"
- Feel free to write actual text

```
BC-1993 - lesson lernstore and geogebra copy (#3532)
 
In order to make sure developers in the future can find out why changes have been made,
we would like some descriptive text here that explains what we did and why.
 
- change some important things
- change some other things
- refactor some existing things
 
# I dont need to mention tests, changes that didnt make it to main, linter, or other fixups
# only leave lines that are relevant changes compared to main
# comments like this will not actually show up in the git history
```

## Windows

We strongly recommend to let git translate line endings. Please set `git config --global --add core.autocrlf input` when working with windows.
