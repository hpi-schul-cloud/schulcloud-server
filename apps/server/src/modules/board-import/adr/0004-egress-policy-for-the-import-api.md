# 0004 - Egress policy for the import API

## Status

Accepted (2026-11-18)

## Context

The import API accepts links from users. A link can point to an internal service or to a host that is not a source tool. Most deployments of the SchulCloud have no limit for outgoing traffic.

## Decision

The pods of the import API have their own egress network policy. It permits only the services that the API uses:

- DNS
- MongoDB (port 27017 to all addresses, because MongoDB is outside the cluster and has no fixed address range)
- RabbitMQ in the same namespace
- the session Valkey with Sentinel

The Ansible role applies the policy before the deployment.

## Consequences

- The import API cannot send a request to a source tool or to another HTTP service. It can only check the format of a link. Only the worker reads the source.
- The policy is a second protection. It does not replace the check of the link in the code, because a network policy does not know host names.
- When the API uses a new service, the policy must permit it. If not, the pod cannot connect and possibly does not start.
- The worker needs its own egress policy, because it must reach the source tools.
