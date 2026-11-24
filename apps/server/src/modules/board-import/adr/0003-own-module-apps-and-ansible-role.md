# 0003 - Own module, apps and Ansible role

## Status

Accepted (2026-11-18)

## Context

The board import is a temporary function: the licenses of the source tools end in 2027. It calls external tools and accepts links from users. It must be possible to deploy, scale, limit and switch off the import without an effect on the other parts of the SchulCloud.

## Decision

- All code of the import is in the module `board-import`.
- The module has two bootable apps: the import API (`board-import-api`, port 3352) and the import worker (`board-import-worker`, port 4456). The API serves `/api/v3/board-import`. The worker serves only `/internal/health`.
- There is no separate image. The apps are part of the server image, as all other apps.
- The Ansible role `board-import` in this repository deploys the import. Each app gets its own deployment.
- The variable `WITH_BOARD_IMPORT` switches the deployment on for an instance and a stage. The default is off.

## Consequences

- The import has its own resources, network policies and secret (`board-import-secret`).
- An error or a high load in the import does not stop the API server.
- The ingress must route `/api/v3/board-import/` to the import API.
- The import API checks the JWT itself. Thus it needs the JWT public key and the session Valkey.
- `dof_app_deploy` must contain the role in its playbooks and set `WITH_BOARD_IMPORT` for each instance.
