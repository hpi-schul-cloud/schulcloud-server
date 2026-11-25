# 0011 - The worker creates a short-lived JWT for the user

## Status

Accepted (2026-11-25)

## Context

The worker creates the imported content through the REST API of the board module and through the upload of the file storage. Both read the user from a JWT and check the permissions of this user. The content must belong to the user who started the import, and each write must go through these permission checks.

The session JWT of the user is not usable. It would be stored in the job, and a logout would stop the import.

Alternatives that were rejected:

- New internal endpoints with an API key and a user ID. The board module and the file storage would each need new endpoints.
- The existing endpoint `POST /admin/authentication/support-jwt` with a service account. The worker would need the key of the admin API and a password. The token is valid for 7 days and identifies a support person.
- An endpoint in the import API that issues the token. The import API is reachable from the internet, and it would then have an endpoint that issues tokens for users.
- A service account that creates the content. The permission checks would use the service account, not the user.

## Decision

- At the start of each attempt, the worker creates a JWT for the user of the job. It signs the token with the JWT private key of the instance and adds it to the whitelist in the session Valkey, as the login of the server does.
- The job stores only the ID of the user. For each token, the worker reads the user, the roles and the account through the services of the user module and the account module. Thus the claims of the token are current, also when the job waited in the queue for a long time.
- If the user or the account does not exist, or if the account is deactivated, the worker creates no token and the job gets the status `failed`.
- The token expires after the maximum duration of a job (see [0008](0008-retry-import-jobs-through-redelivery.md)) plus a small margin. At the end of the attempt, the worker removes the token from the whitelist.
- The worker does not store the token and does not log it. When it creates a token, it logs the job ID and the user ID.
- The token is not identified as a support token or as a service account token.
- If the board API answers with 403, the job gets the status `failed`. If it answers with 401, the attempt fails and the broker delivers the message again.

## Consequences

- The worker checks no permissions and bypasses none. The board module and the file storage make all checks.
- The worker can act as each user in all services that accept the JWT. The worker also reads content from the internet. If the private key leaks, the instance needs a new key pair, and all users must log in again.
- The file storage checks only the signature and the expiry date of a JWT, not the whitelist. There, the expiry date is the only limit for a token.
- A logout of the user does not stop the import. An OIDC backchannel logout and the deletion of the user remove all tokens of the account. The attempt then fails with 401, and the next attempt creates a new token.
- The roles in the token are the roles at the start of the attempt. A change during an attempt has an effect only where a service reads the user from the database, as the board module does.
- The worker imports the user module and the account module and registers their entities, as the provisioning consumers do for the user module. It has no repositories of its own for this data.
- The worker needs the JWT private key, the domain of the instance and the configuration of the session Valkey. Its egress policy must permit the session Valkey with Sentinel. This replaces the rule about the session Valkey in [0009](0009-egress-policy-for-the-import-worker.md).
- The worker needs its own secret. If not, the import API also gets the private key. The private key is then in two secrets, and a key rotation must change the two.
- The options to sign a JWT are in the authentication module and in the import module. They must stay the same.
- No call creates a full board. A restart of the worker continues from the intermediate states in the job.
