# Notification Server

The Notification Server is a dedicated, scalable microservice responsible for real-time notification delivery.

## Core Objective

To enable asynchronous, real-time notification delivery to users in the Vue frontend with automatic cleanup and minimal infrastructure overhead.

## Architectural Decisions

### SSE (Server-Sent Events) over WebSockets
*   **Decision:** Used SSE for unidirectional Server -> Client communication.
*   **Rationale:** SSE is simpler to implement than WebSockets, supports native reconnection, and fits the "push" nature of notifications without the overhead of a bidirectional protocol.

### Dedicated Microservice
*   **Decision:** Created a standalone NestJS application (`notification-server.app.ts`) running on port `3033`.
*   **Rationale:** Isolates long-lived connections (which consume memory and file descriptors) from the main API, ensuring system stability.

### Global Change Stream Observer
*   **Decision:** Instead of one MongoDB cursor per user, each microservice instance opens one single Change Stream.
*   **Rationale:** This is the most efficient way to scale. 1,000 users online result in only 1 database cursor per server instance, rather than 1,000.

### Database-Driven Reactive Delivery
*   **Decision:** The microservice reacts to database inserts via MongoDB Change Streams.
*   **Rationale:** Decouples the delivery system from the rest of the application. API, cron jobs, and background workers simply save a `NotificationEntity`, and the server handles the rest without requiring explicit messaging infrastructure.

## Key Functionality

### Auto-Delete on Delivery
Notifications are "volatile" once seen. The server deletes them from MongoDB the moment they are pushed into the SSE stream (both during initial sync and live events). This eliminates the need for "mark as read" logic.

### Offline Persistence
If a user is offline, notifications remain in MongoDB. They are delivered and instantly deleted the next time the user connects to the stream.

## Infrastructure Requirements

1.  **MongoDB:** Requires a replica set to enable Change Streams.
2.  **Session Store:** Must share the same session storage (Valkey/Redis) as the main API to validate user sessions.
