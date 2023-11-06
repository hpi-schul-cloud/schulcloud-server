# Review 06.11.2023

- On multiple places we have calls to keycloak that MUST be sequencial, even though this is not clear from the functional context (because the Keycloak admin client gets broken if used multiple times in parallel). This is dangerous, as the code might be changed in the future by devs that either dont know, or have forgotten. We should find a way to make this saver, for example by wrapping the client into something that makes the requests sequencial, eg. by queuing the requests.
- nested modules should also have a clear module structure
