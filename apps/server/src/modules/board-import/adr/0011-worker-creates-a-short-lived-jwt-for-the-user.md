# 0011 - The worker creates a short-lived JWT for the user

## Status

Accepted (2026-11-25)

## Context

The worker creates the imported content through the REST API of the board module and through the upload of the file storage. Both read the user from a JWT and check the permissions of this user. The file storage has no upload without such a JWT. Thus the worker needs a token for the user, independently of how it writes the boards.

The session JWT of the user is not usable. It would be stored in the job, and a logout would stop the import. Its whitelist entry also expires after 2 hours without a request (`JWT_TIMEOUT_SECONDS`), while a job can wait up to 30 days.

Rejected alternatives:

- The worker calls the services of the board module in its own process: the upload to the file storage still needs a token.
- New internal endpoints with an API key and a user ID: the board module and the file storage would each need new endpoints.
- The existing endpoint `POST /admin/api/v1/admin/authentication/support-jwt`: the worker would need the key of the admin API and the password of a service account that is permitted to create support tokens. The token is valid for 7 days by default and names the service account as the support user.
- An endpoint in the import API that issues the token: the import API is reachable from the internet.
- A separate internal app that issues the token: the private key stays away from the worker, but the worker still has write access to the full database.
- A service account that creates the content: the permission checks would use the service account, not the user.

## Decision

- At the start of each attempt, the worker creates a JWT for the user of the job. It signs the token with the JWT private key of the instance and adds it to the whitelist in the session Valkey, as the login of the server does.
- The code that creates a token moves from the authentication module into a small module that the login and the worker both use. The worker does not import the authentication module, because that module also loads the login strategies.
- The job stores only the ID of the user. For each token, the worker reads the user, the roles and the account through the services of the user module and the account module. The import module has no repositories of its own for this data. If the user or the account does not exist, or if the account is deactivated, the job gets the status `failed`.
- The token expires at the deadline of the job plus a small margin. The deadline is the first start plus the maximum duration (see [0008](0008-retry-import-jobs-through-redelivery.md)). At the end of the attempt, the worker removes the token from the whitelist.
- The token has no support flag and no service account flag. The worker does not store it and does not log it. When it creates a token, it logs the job ID and the user ID. When a job fails because of the user, the account or a second 403, it logs the reason with the same IDs.
- If the board API or the file storage answers with 401 or 403, the worker creates a new token and sends the request again one time. The file storage also answers with 403 when the token is not in the whitelist. After a second 403, the job gets the status `failed`. After a second 401, the attempt fails and the broker delivers the message again.
- A second 403 and an error of the user or the account set the job to `failed` in each attempt, not only in the last one. This adds to the rule in [0008](0008-retry-import-jobs-through-redelivery.md).

## Consequences

### Security

- The worker has read and write access to the full database of the instance. This access is the trust boundary of the worker, not the JWT. The REST API protects against errors in the worker, not against a worker that an attacker controls.
- With the private key, the worker can make a token for each user, also for administrators, in all services that trust the key. The worker also reads content from the internet. The instance has one key pair and no procedure to replace it. When the key pair is replaced after a leak, all users must log in again.
- The token permits all that the user can do, and a write of the worker looks like an action of the user. A claim that limits the token to the routes of the import is possible later, with a check in the auth guard. It would limit a token that leaks, not a worker that an attacker controls.
- The worker removes the token at the end of the attempt, but in two cases the token stays valid. A worker that stops suddenly does not remove it. A request that is still in progress can add the removed whitelist entry again. The token then stays valid until its expiry date, or until it is not used for `JWT_TIMEOUT_SECONDS` (2 hours by default).

### Behaviour

- A logout of the user does not stop the import. An OIDC backchannel logout removes all tokens of the account, and the worker then continues with a new token. The deletion of the user deactivates the account first, so the job gets the status `failed`.
- The claims of a token are those at the time when the worker creates it. A job can wait up to 30 days by default (see [0006](0006-delete-import-jobs-after-30-days.md)) before the worker creates the first token.
- The exporter of the session Valkey counts each whitelist entry as a session. Thus a token of the worker is in the session metrics until its entry is removed.
- No call creates a full board. An attempt that fails can leave a part of a board, and the next attempt must handle it (see [0007](0007-acknowledge-import-job-after-the-end-status.md)).

### Deployment

- The worker needs the JWT configuration of the server with the key pair, the domain of the instance, and the configuration and the password of the session Valkey. Its egress policy must permit the session Valkey with Sentinel. This replaces the rule about the session Valkey in [0009](0009-egress-policy-for-the-import-worker.md).
- The worker needs its own secret, so that the import API does not get the private key. The key is then in two secrets, and a key rotation must change the two.
- The worker loads the user module and the account module and registers their entities. Thus the worker app becomes larger and can need more configuration.
