# 0009 - Egress policy for the import worker

## Status

Accepted (2026-11-24)

The rule about the session Valkey is superseded by [0011](0011-worker-creates-a-short-lived-jwt-for-the-user.md) (2026-11-25). The worker can then reach the session Valkey, so the check of the host in the code must reject it also.

## Context

The import worker reads boards and files from the source tools, so it must reach hosts on the internet. The links come from users and from the content of the source boards. A link can point to an internal service. The egress policy of the import API permits no HTTP traffic at all (see [0004](0004-egress-policy-for-the-import-api.md)), so the worker needs its own policy.

## Decision

The pods of the import worker have their own egress network policy. It permits only:

- DNS
- MongoDB (port 27017 to all addresses)
- RabbitMQ in the same namespace
- the server API and the file storage API in the same namespace. The worker will create the imported content through these two services. It does not call them yet.
- port 443 to public addresses. The private, the shared (`100.64.0.0/10`) and the link-local address ranges are excluded.

Port 80 is not permitted. The worker has no access to the session Valkey, because it does not check a JWT.

## Consequences

- Through a link on port 443, the worker cannot reach the private network or the metadata service of the cloud provider. Port 53 and port 27017 are open to all addresses, also to private addresses. In the cluster, the worker can also reach RabbitMQ, the server API and the file storage API. A link that points to one of these is not stopped by the policy, so the check of the host in the code must reject it.
- The policy does not limit the worker to the hosts of the source tools, because a network policy does not know host names. The code must check the host of each link.
- A source that offers only HTTP cannot be imported.
- The worker calls the server API and the file storage through their services in the cluster, not through the public address. The public address goes through the ingress controller, which the policy does not permit.
- When the worker uses another internal service, the policy must permit it.
