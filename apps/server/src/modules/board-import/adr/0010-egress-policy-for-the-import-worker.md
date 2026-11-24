# 0010 - Egress policy for the import worker

## Status

Accepted (2026-11-24)

## Context

The import worker reads boards and files from the source tools, so it must reach hosts on the internet. The links come from users and from the content of the source boards. A link can point to an internal service. The egress policy of the import API permits no HTTP traffic at all (see [0004](0004-egress-policy-for-the-import-api.md)), so the worker needs its own policy.

## Decision

The pods of the import worker have their own egress network policy. It permits only:

- DNS
- MongoDB (port 27017 to all addresses)
- RabbitMQ in the same namespace
- port 443 to public addresses. The private and the link-local address ranges are excluded.

Port 80 is not permitted. The worker has no access to the session Valkey, because it does not check a JWT.

## Consequences

- The worker cannot reach a service in the cluster or in the private network through a link, and it cannot reach the metadata service of the cloud provider.
- The policy does not limit the worker to the hosts of the source tools, because a network policy does not know host names. The code must check the host of each link.
- A source that offers only HTTP cannot be imported.
- When the worker calls the board module or the file storage, the policy must permit these services.
- The limits of the worker (prefetch count, maximum attempts, maximum duration) use the defaults of the code. A deployment sets the environment variables only when it needs other values.
