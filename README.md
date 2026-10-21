# Schul-Cloud Server

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hpi-schul-cloud_schulcloud-server&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hpi-schul-cloud_schulcloud-server)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=hpi-schul-cloud_schulcloud-server&metric=coverage)](https://sonarcloud.io/summary/new_code?id=hpi-schul-cloud_schulcloud-server)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=hpi-schul-cloud_schulcloud-server&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=hpi-schul-cloud_schulcloud-server)
## NestJS application

Based on [NestJS](https://docs.nestjs.com/)

> Find the [documentation](https://documentation.dbildungscloud.dev/docs/intro) of this repository at GitHub pages. It contains information about

- api design
- code guidelines
- development
- migrations
- architecture

There is also some old documentation in the server code /apps/server/doc/*.md.

Note that not all the .md file here are up to date.

## NestJS Console Applications

### Sync console
> Find the [Documentation](./apps/server/src/infra/sync/console/README.md) here.

## Room invitation credentials

New room invitations have an internal ObjectId (`id`) and a separate secret
`invitationToken`, generated from 32 cryptographically random bytes and encoded as
43 base64url characters. Authorized create, update, and list responses include the
token. Metadata updates preserve it; clients cannot supply or change it.

Use `invitationToken ?? id` when building share/copy/QR URLs. Pass that value
unchanged to `POST /api/v3/room-invitation-links/:roomInvitationLinkId`. Redemption
accepts a 43-character base64url token or a legacy 24-character hexadecimal ID.
Malformed values return 400; unknown credentials return 404 (`INVALID_LINK`).
Authentication and all existing invitation restrictions still apply.

Keep using `id` for administrative update/delete operations. Token-backed
invitations **cannot** be redeemed using their internal IDs. Existing invitations
without a token retain their original URLs indefinitely, including after metadata
updates. No data backfill is required; these legacy URLs remain guessable until
their invitations expire or are deleted and replaced.

The separate frontend must update its API types, share URL generation, and
ObjectId-only redemption guards. Preserve tokens, including their case, through
login redirects and pending-invitation storage; never truncate, lowercase, or log
them. Cover both token and legacy URLs, malformed values, and login round-trips
with frontend tests.

Deploy frontend support for optional tokens before enabling token creation on the
server, and coordinate reloads of older frontend bundles: old clients would copy
internal IDs and produce unusable links for new invitations. During the server
release, run the established index synchronization (`npm run ensureIndexes:prod`)
with the new entity definitions before exposing token-backed creation. It creates
the unique partial `roomInvitationTokenUniqueIndex`, which allows multiple legacy
records without tokens. Smoke-test a new shared link, rejection of its internal
ID, and an existing legacy URL. Do not restore unrestricted ID redemption as a
compatibility workaround.


## Feathers application

This is legacy part of the application!

Based on [Node.js](https://nodejs.org/en/) and [Feathers](https://feathersjs.com/)

## Application seperation

In order to seperate NestJS and Feathers each application runs in its own express instance. These express instances are then mounted on seperate paths under a common root express instance.

```
Root-Express-App 
├─ api/v1/       --> Feathers-App
├─ api/v3/       --> NestJS-App
```

This ensures that each application can run its own middleware stack for authentication, error handling, logging etc.

The mount paths don't have any impact on the routes inside of the applications, e.g. the path `/api/v3/news` will translate to the inner path `/news`. That means that in terms of route matching each child application doesn't have to take any measures regarding the path prefix. It simply works as it was mounted to `/`.

**However note** that when URLs are generated inside a child application the path prefix has to be prepended. Only then the generated URLs match the appropriate child application, e.g. the path `/news` has to be provided as the external path `/api/v3/news`.

It is possible (not very likely) that the server api is called with URLs that use the old schema without a path prefix. As a safety net for that we additionally mount the Feathers application as before under the paths:

- `/` - for internal calls
- `/api` - for external calls

When these paths are accessed an error with context `[DEPRECATED-PATH]` is logged.

## How to name your branch and create a pull request (PR)

1. Take the Ticket Number from JIRA (ticketsystem.dbildungscloud.de), e.g. SC-999
2. Name the feature branch beginning with Ticket Number, all words separated by dash "-", e.g. `SC-999-fantasy-problem`
3. Create a PR on branch develop containing the Ticket Number in PR title
4. Keep the `WIP` label as long as this PR is in development, complete PR checklist (is automatically added), keep or increase code test coverage, and pass all tests before you remove the `WIP` label. Reviewers will be added automatically.

## Committing

Default branch: `main`

1. Go into project folder
2. Checkout to develop branch (or clone for the first time)
3. Run `git pull`
4. Create a branch for your new feature named BC-*Ticket-ID*-*Description*
5. Run the tests (see above)
6. Commit with a meaningful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
7. Start a pull request (see above) to branch develop to merge your changes
