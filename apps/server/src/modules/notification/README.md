# Notification Module

This module handles the logic for real-time notifications via Server-Sent Events (SSE).

## Key Components

*   **NotificationObserverService:** A singleton watcher that tails the MongoDB oplog using Change Streams.
*   **NotificationController:** The SSE gateway that merges the "Initial Sync" (past unread) with the "Live Stream" (real-time changes).
*   **NotificationService:** Core domain service for managing notifications.
*   **NotificationRepo:** Handles persistence and provides methods like `findForUser` and `delete`.

## Delivery Logic

The module implements a **volatile delivery** pattern:
*   **Auto-Delete:** Notifications are deleted from the database immediately after being pushed to the SSE stream. This applies to both the initial sync of missed notifications and live real-time events.
*   **No Read State:** Because notifications are deleted upon delivery, there is no need for a "mark as read" state in the database.

## Exports

*   `NotificationService`: Can be used by other modules to trigger notifications by saving them to the database.
