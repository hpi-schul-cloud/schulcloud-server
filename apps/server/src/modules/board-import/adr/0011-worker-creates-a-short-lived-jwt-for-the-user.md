# 0011 - The worker creates a short-lived JWT for the user

## Status

Accepted (2026-11-25)

## Context

The worker creates the imported content through the REST API of the board module and through the upload of the file storage. Both read the user from a JWT and check the permissions of this user. The content must belong to the user who started the import, and each write must go through these permission checks.

The file storage has no upload without the JWT of a user. Its AMQP API offers no upload. Thus the worker needs a token for the user, independently of how it writes the boards.

The session JWT of the user is not usable. It would be stored in the job, and a logout would stop the import.

Alternatives that were rejected:

- The worker calls the services of the board module in its own process. The upload to the file storage would still need a token.
- New internal endpoints with an API key and a user ID. The board module and the file storage would each need new endpoints.
- The existing endpoint `POST /admin/authentication/support-jwt` with a service account. The worker would need the key of the admin API and a password. The token is valid for 7 days and identifies a support person.
- An endpoint that issues a token only for the user of a running job. In the import API, this is an endpoint that issues tokens for users in an app that is reachable from the internet. In a separate internal app, it keeps the private key away from the worker. But this gives little while the worker has write access to the full database.
- A service account that creates the content. The permission checks would use the service account, not the user.

## Decision

- At the start of each attempt, the worker creates a JWT for the user of the job. It signs the token with the JWT private key of the instance and adds it to the whitelist in the session Valkey, as the login of the server does.
- The job stores only the ID of the user. For each token, the worker reads the user, the roles and the account through the services of the user module and the account module. Thus the claims of the token are current, also when the job waited in the queue for a long time.
- The import module has no repositories or entities of its own for users, roles and accounts, and it does not query their collections. This data stays in the modules that own it. The worker imports these modules and registers their entities, because all apps of the server use the same database. The provisioning consumers do the same for the user module.
- If the user or the account does not exist, or if the account is deactivated, the worker creates no token and the job gets the status `failed`.
- The token expires at the deadline of the job plus a small margin. The deadline is the first start plus the maximum duration (see [0008](0008-retry-import-jobs-through-redelivery.md)). At the end of the attempt, the worker removes the token from the whitelist.
- The worker does not store the token and does not log it. When it creates a token, it logs the job ID and the user ID.
- The token is not identified as a support token or as a service account token.
- If the board API answers with 403, the job gets the status `failed`. If it answers with 401, the attempt fails and the broker delivers the message again.

## Consequences

- The worker has read and write access to the full database of the instance. This access, not the JWT, is the trust boundary of the worker. The REST API gives the validation and the permission checks of the board module, and it protects against errors in the worker. It does not protect against a worker that an attacker controls.
- The private key adds to this access: tokens for each user, also for the administrators of the instance, in all services that trust the key. The worker also reads content from the internet. The instance has one key pair and no procedure to replace it. After a leak, an attacker can make tokens until the key pair is replaced, and then all users must log in again.
- The token permits all that the user can do, not only writes to boards and files.
- The guard of the file storage checks only the signature and the expiry date of a JWT, not the whitelist. But its use cases ask the authorization API of the server with the same JWT, and the server checks the whitelist. Thus the removal from the whitelist also stops the token in the file storage, for each endpoint that checks permissions.
- A worker that stops does not remove its token. The token is not stored, so the import cannot revoke it. It stays valid until its expiry date.
- The whitelist check reads the entry and then writes it again. A request of an aborted import step that is still in progress can write a removed entry again. Then only the expiry date limits the token.
- A job can wait in the queue until it expires (see [0006](0006-delete-import-jobs-after-30-days.md)). The worker then creates a token for a user who possibly did not log in for a long time. It checks only that the user and the account exist and that the account is not deactivated. There is no maximum age for a waiting job.
- A logout of the user does not stop the import. An OIDC backchannel logout and the deletion of the user remove all tokens of the account. The attempt then fails with 401, and the next attempt creates a new token.
- The roles in the token are the roles at the start of the attempt. A change during an attempt has an effect only where a service reads the user from the database, as the board module does.
- The worker loads the user module and the account module with all modules that these import. Thus the worker app becomes larger and can need more configuration.
- The worker needs the JWT private key, the domain of the instance and the configuration of the session Valkey. Its egress policy must permit the session Valkey with Sentinel. This replaces the rule about the session Valkey in [0009](0009-egress-policy-for-the-import-worker.md).
- The worker needs its own secret. If not, the import API also gets the private key. The private key is then in two secrets, and a key rotation must change the two.
- The options to sign a JWT are in the authentication module and in the import module. They must stay the same.
- No call creates a full board. A restart of the worker continues from the intermediate states in the job.
