# 0001 - Share link as the only access to source boards

## Status

Accepted (2026-11-17)

## Context

The board import copies boards from TaskCards, Edumaps and Padlet into the SchulCloud. These tools have no official interface for this. The import could connect to the account of the user in the source tool, or it could read what the source tool shows to a visitor of a shared board.

## Decision

The import reads a source board only through its share link. There is no connection to accounts or interfaces of the source tools. The user gives the share link when the import starts, and the import API accepts only `https` links.

## Consequences

- The SchulCloud stores no credentials of the source tools.
- The import gets only the content that a visitor of the shared board gets. It cannot import a board that is not shared.
- A share link can contain an access token. The link is confidential: it is stored only in the import job and is not written to logs.
