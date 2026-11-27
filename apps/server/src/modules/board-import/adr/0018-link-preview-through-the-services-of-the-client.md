# 0018 - The link preview comes from the services that the client uses

## Status

Accepted (2026-11-27)

## Context

A link element of a board shows a preview: a title, a description and an image. The API of the board does not make the preview. It stores the values that the caller sends. The client gets the title, the description and the address of the image from an endpoint of the server that reads the page of the link. For the image, the client then tells the file storage to load it from that address and to store it as a file of the link element.

The worker has one HTTP client for requests to the internet, and that client permits only the hosts of the source of the job ([0013](0013-checked-requests-to-the-sources.md)). A link of a card can point to each host.

Rejected alternatives:

- The worker reads the page of the link and loads the image itself: the worker holds the JWT private key ([0011](0011-worker-creates-a-short-lived-jwt-for-the-user.md)) and would send requests to hosts that a source board names.
- No preview: an imported link element would show less than a link element that a user creates.
- The worker loads the image and sends it to the regular upload of the file storage: this has the same problem as the first alternative.

## Decision

- The worker creates the preview with the same two requests as the client, with the token of the user: the endpoint of the server for the title, the description and the address of the image, and the upload from a URL of the file storage for the image.
- The upload from a URL is permitted only for the preview image of a link element. The address of that image comes from the server, which has checked it. A file of a source board must not use this upload.
- The worker requests a preview only for a link to a page. A link with another protocol, for example a mail address, gets no preview.
- The preview is optional. If one of the two requests fails, the worker creates the link element without the part that is missing, and the import continues. An answer with the status 403 is such a failure also, and it does not set the job to `failed`. An answer with the status 401 is not such a failure: the rule for the token applies ([0011](0011-worker-creates-a-short-lived-jwt-for-the-user.md)).
- The preview is not part of the board plan. The worker requests it when it creates the element.

## Consequences

- The worker sends no request to the host of a link. The server and the file storage send these requests, with their own checks and their own egress rules.
- An imported link element has the same preview as a link element that a user creates, with the same limits.
- A new attempt requests the preview again for each card that has no checkpoint ([0016](0016-checkpoints-and-board-plan-in-the-import-job.md)). The preview can then be different.
- Each link to a page needs up to two more requests, and each of them can take some seconds. This counts against the maximum duration of the job.
- The address of a link is content of the source board. It goes to the server in a request body. It must not be written to the log.
