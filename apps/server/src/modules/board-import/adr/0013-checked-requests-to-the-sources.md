# 0013 - Each request to a source goes through one checked client

## Status

Accepted (2026-11-26)

## Context

The worker reads boards from the source tools. The link of a job comes from a user, and a source can answer with a redirect. Both can point to an internal service.

The import API checks only the format and the host name of the link ([0004](0004-egress-policy-for-the-import-api.md)). The egress policy of the worker blocks the private address ranges on port 443 only. It does not know host names, and it permits DNS, MongoDB and some services in the cluster ([0009](0009-egress-policy-for-the-import-worker.md)). The worker also holds the JWT private key ([0011](0011-worker-creates-a-short-lived-jwt-for-the-user.md)). Thus the code must check each request before it leaves the worker.

Rejected alternatives:

- Check the link only one time before the first request: a redirect or a second DNS answer can then lead to another target.
- Check the address after the connection: the request is already sent to the wrong target.
- An own list of the special address ranges and an own DNS lookup before the request: the server already uses the library `request-filtering-agent` for link previews and tool logos. Its check is part of the lookup of the connection.
- Let the HTTP library follow redirects: the redirect target is not checked.

## Decision

- The worker has one HTTP client for all requests to a source. No other code sends a request to a source.
- Before each request, the client checks the URL:
  - The scheme is `https`. The URL has no user name, no password and no port.
  - The host is a host name from the host list of the source of the job. The rules are the same as in the import API.
  - All addresses that the host name resolves to must be public. If one address is private, loopback, link-local, shared or another special address, the URL is rejected.
- The check of the addresses uses the HTTPS agent of `request-filtering-agent`. The agent checks the addresses in the DNS lookup of the connection itself, before the connection opens. Thus no second lookup can give an address that is not checked.
- The HTTP library does not follow redirects and does not use a proxy from the environment. The client follows a redirect itself, and the redirect target goes through the same check. The headers of the caller go only to the host of the first request.
- Each request has a time limit and a maximum size of the answer. Each call has a maximum number of redirects. The limits are part of the configuration of the worker.
- The worker sends no token and no key of the SchulCloud to a source. It sends only what the source gives to a visitor.
- The worker reads the source before it creates the board.
- The rule for the host is one function of the module. The import API and the worker both use it.
- A rejected URL, too many redirects, an answer above the size limit and a source that is not readable with the link set the job to `failed` at once. The attempt creates no board.
- A timeout, a network error and the statuses 408, 429 and 5xx fail the attempt. The broker delivers the message again after the retry delay ([0008](0008-retry-import-jobs-through-redelivery.md)). The client has no retry of its own.

## Consequences

- Each request to a source uses a new connection. Connections are not reused.
- A source whose host name resolves to a private address cannot be imported, also if only one of its addresses is private.
- A redirect to a host that is not in the host list of the source fails the job. A new host of a source must be added to the list.
- A source that is slow or not available uses the attempts of the job. After the last attempt, the job is `failed`.
- A host name that does not resolve and a certificate error also use all attempts. A DNS error in the cluster can be temporary, so the client does not reject these errors at once.
- The list of special address ranges comes from the library. The library gives no error code, so the client finds a rejected address and an answer above the size limit by the text of the error. Tests with real requests fail when an update of the library or of axios changes these texts.
- The egress policy stays the second layer. It does not replace the check, and the check does not replace it.
