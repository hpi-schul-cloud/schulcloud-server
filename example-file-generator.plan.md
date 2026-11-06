# Example file generator – plan

## Goal
A console command that creates realistic `FileEntity` records (legacy files, via `FilesRepo`) plus matching S3 objects, linked to real users / courses / teams, so that e.g. `files cleanup-job` and the user-deletion saga can be checked manually.

## Decisions (approved)
| Topic | Decision |
|---|---|
| Owner kinds | personal (`FileOwnerModel.USER`), course (`COURSE`), teams (`TEAMS`) |
| Breakage (teams files only) | no storageProvider, unknown storageProvider (bad credentials), non-existing bucket, marked deleted (`deletedAt` in past), directory entries |
| Storage | Upload to S3 **and** create DB entry |
| Entities | Pick existing users / courses / teams from DB (seed data); fail with clear error if none exist |
| Configuration | JSON config file |
| Cleanup | Generated files tagged by name prefix; `--remove` option deletes them (S3 + DB) |

## Command
Added to the existing `files` console (`@Console({ command: 'files' })`), in `apps/server/src/modules/files/job/`:

```
files generate-example-files <configPath>
files generate-example-files <configPath> --remove
```
(`nest:start:console -- files generate-example-files ./example-files.config.json`)

## Config file (JSON)
```json
{
  "exampleFilesDir": "/abs/or/relative/path/to/example-files",
  "counts": { "personal": 10, "course": 10, "teams": 10 },
  "brokenTeamsFiles": {
    "noStorageProvider": 2,
    "unknownStorageProvider": 2,
    "nonExistingBucket": 2,
    "markedDeleted": 2,
    "directories": 2
  },
  "storageProviderId": "optional – defaults to first provider from DB",
  "namePrefix": "generated-"
}
```
Validation (class-validator): counts >= 0; sum of broken counts must be <= `counts.teams` (broken files are a subset of the teams files, remaining are valid). Directory entries are counted inside the teams total as well.

## Design
- `GenerateExampleFilesConsole` – parses args, calls UC, logs (like `DeleteFilesConsole`).
- `GenerateExampleFilesUc` – orchestration:
  1. Load + validate config; read files from `exampleFilesDir` (non-recursive, round-robin; fail if empty). MIME type derived from extension, size from stat.
  2. Load targets: users, courses, teams via MikroORM `EntityManager` (limited sample, distributed round-robin over owners) – fail if a requested kind has no entities.
  3. Load `StorageProviderRepo.findAll()`; create S3 client per provider (same as `DeleteFilesUc.createClient`); pick provider; ensure bucket exists (bucket name per school, e.g. `bucket-<schoolId>`, matching the legacy convention).
  4. For each file: upload object to `<ownerId>/<uuid>-<name>` via S3 `PutObject`, create `FileEntity` (name prefixed, `ownerId`, `refOwnerModel`, `creatorId` = a user, `permissions` for owner, size/type/bucket/storageFileName/storageProvider), persist via `FilesRepo.save` in batches.
  5. Breakage for teams files:
     - no storageProvider → `storageProvider` unset (UC throws "has no provider")
     - unknown provider → reference to a `StorageProviderEntity` not in the DB-provided client map
       (extra provider with bad credentials, see resolved point 2)
     - non-existing bucket → valid provider, `bucket` set to a bucket that is never created (exercises the NoSuchBucket branch)
     - marked deleted → `deletedAt` set (e.g. 30 days ago) + `deleted: true`, so `findForCleanup` picks it up
     - directory → `isDirectory: true`, no storage fields
  6. Print a summary table (kind, owner id/name, file id, defect) so results can be verified manually in UI / DB.
- `--remove`: find files via `namePrefix`, delete from S3 (ignoring missing objects/buckets) and then via `FilesRepo.delete`.
- Registration: add `GenerateExampleFilesConsole` + `GenerateExampleFilesUc` to providers in `files-console.module.ts`; export from `job/index.ts`. Needs `EntityManager` access (already available through MikroORM in the console app) and `LoggerModule`.
- Safety: refuse to run when `NODE_ENV` is production-like (configurable guard).

## Tests
- Unit tests for UC (mock `FilesRepo`, S3 client, `StorageProviderRepo`; verify counts and each breakage variant) and console, following existing `delete-files.*.spec.ts`.
- Config validation tests.

## Resolved points (approved)
1. Bucket/S3 naming follows the legacy convention: bucket `bucket-<schoolId>`, key `<ownerId>/<uuid>-<name>`.
2. "Unknown storage provider": create an extra `StorageProviderEntity` with bad credentials; `findAll` returns it, so S3 deletion fails with an auth error (and the file stays in DB). `--remove` deletes this provider again.
3. Owner selection: files are spread evenly over all users, courses and teams. Optionally `userIds` in the config restricts this: personal files go to those users, and courses/teams are limited to those the users are members of. Unknown ids or empty results fail with a clear error.
4. Production guard: the command refuses to run in production-like environments.

Config addition:
```json
"userIds": ["optional list of user ids"]
```
