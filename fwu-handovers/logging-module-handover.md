# Technical Handover: Logging & Error Pipeline

## Document Purpose & Structure

This document guides new developers through the logging infrastructure and error pipeline. It's designed to be presented by someone familiar with the code, not read in isolation. The structure follows a logical learning path: concepts → Loggable pattern → Logger usage → error pipeline → practical guidance.

---

## 1. Overview & Conceptual Foundation

### 1.1 Core Design Principle: Loggables, not Strings

The logging system is built around **structured, privacy-aware logging**. You cannot log arbitrary strings. Instead, every log message must be a **Loggable** — a class that implements the `Loggable` interface and produces a structured `LogMessage`.

**Why?**
- **Privacy:** Prevents accidental logging of personal data in freeform strings
- **Searchability:** Structured messages with fixed `message` fields are easy to search and alert on
- **Consistency:** Every log entry has the same shape

### 1.2 Key Architectural Rule: Errors Are Not Logged Manually

The `Logger` exposes `info`, `warning`, `notice`, and `debug` — but **no `error` method**. All errors are logged automatically by the **global exception filter** in the `ErrorModule`. You throw an exception, and the pipeline handles logging it.

```
┌──────────────────────────────────────────────────────────────┐
│ Your Code                                                     │
│                                                               │
│  Option A: Log informational message                          │
│  this.logger.info(new YourLoggable(data))                     │
│                                                               │
│  Option B: Throw an error (auto-logged)                       │
│  throw new YourLoggableException(data)                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Logger (info/warning/notice/debug)                           │
│  → Winston → Console                                          │
│                                                               │
│  GlobalErrorFilter (catches all thrown errors)                 │
│  → DomainErrorHandler → ErrorLogger.error()                   │
│  → Winston → Console                                          │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Log Levels (RFC 5424 / Syslog)

The system uses **syslog levels**, not the default NestJS levels:

| Level | Logger | Used for |
|-------|--------|----------|
| `debug` | `Logger.debug()` | Development-time detail |
| `info` | `Logger.info()` | Normal operational messages |
| `notice` | `Logger.notice()` | Significant but normal events (e.g., request logs) |
| `warning` | `Logger.warning()` | Unexpected situations that aren't errors |
| `error` | `ErrorLogger.error()` | ⚠️ **Only via ErrorModule** — never call directly |
| `crit` | `ErrorLogger.crit()` | ⚠️ **Only via ErrorModule** |
| `alert` | `ErrorLogger.alert()` | ⚠️ **Only via ErrorModule** |
| `emerg` | `ErrorLogger.emerg()` | ⚠️ **Only via ErrorModule** |

The minimum log level is configured via `NEST_LOG_LEVEL` env variable (default: `notice`).

---

## 2. The Loggable Interface

### 2.1 Interface Definition

📁 [loggable.ts](../apps/server/src/core/logger/interfaces/loggable.ts)

```typescript
export interface Loggable {
    getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage;
}
```

This is the single contract for all logging. Every log-worthy event becomes a class that implements this interface.

### 2.2 Log Message Types

📁 [logging.types.ts](../apps/server/src/core/logger/types/logging.types.ts)

| Type | Used for | Key fields |
|------|----------|------------|
| `LogMessage` | Informational logs | `message` (string), `data?` (structured) |
| `ErrorLogMessage` | Error logs | `error?`, `type`, `stack?`, `data?` |
| `ValidationErrorLogMessage` | Validation errors | `validationErrors[]`, `type`, `stack?` |

```typescript
type LogMessage = {
    message: string;
    data?: LogMessageData;
};

type ErrorLogMessage = {
    error?: Error;
    type: string;
    stack?: string;
    data?: LogMessageDataObject;
};

type LogMessageData = LogMessageDataObject | string | number | boolean | undefined;
type LogMessageDataObject = { [key: string]: LogMessageData };
```

---

## 3. Building Loggables

### 3.1 Informational Loggable (plain log message)

For logging events that are not errors — e.g., "migration started", "sync completed":

```typescript
export class UserLoginMigrationStartLoggable implements Loggable {
    constructor(
        private readonly userId: EntityId,
        private readonly userLoginMigrationId: EntityId | undefined,
    ) {}

    getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
        return {
            message: 'The school administrator started the migration for his school.',
            data: {
                userId: this.userId,
                userLoginMigrationId: this.userLoginMigrationId,
            },
        };
    }
}
```

📁 Example: [user-login-migration-start.loggable.ts](../apps/server/src/modules/user-login-migration/domain/loggable/user-login-migration-start.loggable.ts)

**Usage in a service or UC:**
```typescript
this.logger.info(new UserLoginMigrationStartLoggable(userId, migrationId));
```

### 3.2 Loggable Exception (error that carries its own log structure)

For errors where you want **richer log output** than just the exception message. These are classes that extend a NestJS `HttpException` **and** implement `Loggable`:

```typescript
export class InvalidLinkUrlLoggableException extends BadRequestException implements Loggable {
    constructor(
        private readonly url: string,
        readonly message: string,
    ) {
        super();
    }

    getLogMessage(): ErrorLogMessage {
        return {
            type: 'INVALID_LINK_URL',
            message: this.message,
            stack: this.stack,
            data: { url: this.url },
        };
    }
}
```

📁 Example: [invalid-link-url.loggable.ts](../apps/server/src/modules/meta-tag-extractor/loggable/invalid-link-url.loggable.ts)

**Naming convention:** `<Name>LoggableException` — the word "Loggable" before "Exception".

**Usage:** Just throw it. The error pipeline will detect it implements `Loggable` and use `getLogMessage()` for logging:
```typescript
throw new InvalidLinkUrlLoggableException(url, 'URL is malformed');
```

### 3.3 Rules & Best Practices

| Rule | Details |
|------|---------|
| **Fixed message** | The `message` string in `getLogMessage()` should be a constant, not interpolated user data. Put variable data in the `data` field. |
| **No unit tests for Loggables** | Current best practice: Loggables are simple data carriers with no logic — writing unit tests for them is not required. |
| **Place Loggables near their domain** | Put them in a `loggable/` folder inside the module that uses them (e.g., `modules/user-import/loggable/`). |
| **Don't log errors manually** | Throw exceptions, let the pipeline handle it. Use `Logger.info/warning/debug/notice` for non-error messages only. |

---

## 4. The Logger

### 4.1 Logger Service

📁 [logger.ts](../apps/server/src/core/logger/logger.ts)

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class Logger {
    info(loggable: Loggable): void
    warning(loggable: Loggable): void
    notice(loggable: Loggable): void
    debug(loggable: Loggable): void
    setContext(name: string): void
}
```

**Key design decisions:**
- **Transient scope:** Each injection creates a new instance, so each service gets its own context
- **No `error()` method:** Intentional — errors go through the exception filter
- **Accepts only `Loggable`:** Not strings, not objects

### 4.2 How to Inject and Use

```typescript
import { Logger } from '@src/core/logger';

export class YourUc {
    constructor(private logger: Logger) {
        this.logger.setContext(YourUc.name);  // Sets context shown in log output
    }

    public doSomething(): void {
        this.logger.info(new SomeLoggable(relevantData));
    }
}
```

### 4.3 What Happens When You Call `logger.info()`

```
logger.info(loggable)
    → LoggingUtils.createMessageWithContext(loggable, context)
        → loggable.getLogMessage()             // your structured message
        → util.inspect(message)                // stringified for output
        → { message: stringified, context }    // wrapped with context
    → winstonLogger.info({ message, context })
        → Console transport → stdout
```

📁 [logging.utils.ts](../apps/server/src/core/logger/logging.utils.ts)

The `LoggingUtils.stringifyMessage()` method uses `util.inspect()` and strips newlines. This means the entire structured message is serialized into a single-line string for the console output.

### 4.4 Output Format

```
[NestWinston] Info - 2023-05-31 15:20:30.888   [YourUc] { message: 'I am a log message.', data: { userId: '0000d231816abba584714c9e' } }
```

Components: `[NestWinston]` · Level · Timestamp · `[Context]` · Stringified LogMessage

---

## 5. The Error Pipeline

### 5.1 Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│ Your code throws an exception                                   │
│   throw new ForbiddenException('...')                           │
│   throw new YourLoggableException(data)                        │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ GlobalErrorFilter (@Catch(), APP_FILTER)                        │
│ 📁 global-error.filter.ts                                      │
│                                                                 │
│  1. Detects context type (HTTP / RPC / WebSocket)              │
│  2. Delegates to DomainErrorHandler for logging                │
│  3. Creates HTTP/RPC/WS error response                         │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ DomainErrorHandler                                              │
│ 📁 domain-error-handler.ts                                     │
│                                                                 │
│  Decides HOW to log the error:                                 │
│  • If error implements Loggable → use error.getLogMessage()    │
│  • If error is a plain Error → wrap in ErrorLoggable           │
│  • Otherwise → wrap unknown value in Error, then ErrorLoggable │
│                                                                 │
│  For HTTP context: adds request info (method, url, userId)     │
│                                                                 │
│  Calls: ErrorLogger.error(loggable)                            │
└──────────────────────┬─────────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ ErrorLogger                                                     │
│ 📁 error-logger.ts                                             │
│                                                                 │
│  Singleton (not transient like Logger)                          │
│  Exposes: emerg(), alert(), crit(), error()                    │
│  ⚠️ May only be used in the ErrorModule                        │
│                                                                 │
│  → Winston → Console                                           │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 GlobalErrorFilter

📁 [global-error.filter.ts](../apps/server/src/core/error/filter/global-error.filter.ts)

Catches **all** exceptions (via `@Catch()` with no arguments). Registered as the global `APP_FILTER` in `ErrorModule`.

**Response creation logic** (HTTP context):
1. **Feathers errors** → uses `code`, `className`, `name`, `message`
2. **BusinessErrors** → calls `error.getResponse()` (or `ApiValidationErrorResponse` for validation errors)
3. **NestJS HttpExceptions** → uses status code, strips "Loggable"/"Exception" from name for the `type` field
4. **Unknown errors** → returns `500 Internal Server Error`

### 5.3 DomainErrorHandler

📁 [domain-error-handler.ts](../apps/server/src/core/error/domain/domain-error-handler.ts)

The central decision point for error logging:

```typescript
private createErrorLoggable(error: unknown, data?: LogMessageDataObject): Loggable {
    if (LoggingUtils.isInstanceOfLoggable(error)) {
        return error;                          // Error carries its own log message
    } else if (error instanceof Error) {
        return new ErrorLoggable(error, data); // Wrap plain Error
    } else {
        return new ErrorLoggable(new Error(util.inspect(error)), data); // Wrap unknown
    }
}
```

For HTTP contexts, it also extracts `userId`, `method`, `endpoint`, `params`, and `query` from the request and attaches them to the log.

### 5.4 ErrorLoggable (the fallback wrapper)

📁 [error.loggable.ts](../apps/server/src/core/error/loggable/error.loggable.ts)

When an error does **not** implement `Loggable`, the `DomainErrorHandler` wraps it in `ErrorLoggable`. This classifies the error:

| Error Type | `type` field in log |
|------------|-------------------|
| `ApiValidationError` | `"API Validation Error"` (with detailed field-level messages) |
| Feathers error | `"Feathers Error"` |
| `BusinessError` | `"Business Error"` |
| NestJS `HttpException` | `"Technical Error"` |
| Everything else | `"Unhandled or Unknown Error"` |

### 5.5 ErrorModule

📁 [error.module.ts](../apps/server/src/core/error/error.module.ts)

```typescript
@Module({
    imports: [LoggerModule],
    providers: [
        { provide: APP_FILTER, useClass: GlobalErrorFilter },
        DomainErrorHandler,
    ],
    exports: [DomainErrorHandler],
})
export class ErrorModule {}
```

---

## 6. Special Loggers

### 6.1 AuditLogger

📁 [audit-logger.ts](../apps/server/src/core/logger/audit-logger.ts)

An independent logger that **always logs at `info` level**, regardless of the configured `NEST_LOG_LEVEL`. Used for audit trails that must never be silenced.

```typescript
auditLogger.logServiceAccountAction(serviceAccountId, 'Created user', { targetUserId });
auditLogger.logServiceAccountApiCall(serviceAccountId, 'POST', '/users', 201);
```

It has its own Winston instance (provided via `AUDIT_LOGGER_PROVIDER`) so its level is independent.

### 6.2 LegacyLogger (deprecated)

📁 [legacy-logger.service.ts](../apps/server/src/core/logger/legacy-logger.service.ts)

The old string-based logger. Still exists for transitional code but is **deprecated**. It accepts plain `unknown` values instead of `Loggable` objects. Do not use it in new code.

### 6.3 Request Logger Middleware

📁 [request-logger-middleware.ts](../apps/server/src/core/logger/request-logger-middleware.ts)

Optional HTTP request logging (enabled via `REQUEST_LOG_ENABLED=true`). Logs method, URL, status code, and response time at `notice` level. Uses the NestJS built-in `Logger`, not the custom `Logger`.

---

## 7. LoggerModule

📁 [logger.module.ts](../apps/server/src/core/logger/logger.module.ts)

```typescript
@Module({
    imports: [WinstonModule.forRootAsync(...)],
    providers: [LegacyLogger, Logger, ErrorLogger, AuditLogger, auditLoggerProvider],
    exports: [LegacyLogger, Logger, ErrorLogger, AuditLogger],
})
export class LoggerModule {}
```

**Winston configuration:**
- Uses `nest-winston` integration
- Transport: Console only (with timestamp + nestLike formatting)
- Level: from `NEST_LOG_LEVEL` config
- `exitOnError`: from `EXIT_ON_ERROR` config (default `true`)
- `handleExceptions` and `handleRejections` enabled on the console transport

---

## 8. Directory Structure

```
core/logger/
├── index.ts                           # Public exports
├── logger.module.ts                   # Module definition
├── logger.ts                          # Logger service (info/warning/notice/debug)
├── logger.config.ts                   # Configuration (log level, exitOnError, etc.)
├── error-logger.ts                    # ErrorLogger (error/crit/alert/emerg) — ErrorModule only
├── audit-logger.ts                    # AuditLogger (always-on info-level logging)
├── legacy-logger.service.ts           # Deprecated string-based logger
├── logging.utils.ts                   # Stringify + isInstanceOfLoggable
├── request-logger-middleware.ts       # HTTP request logging middleware
├── interfaces/
│   └── loggable.ts                    # Loggable interface
├── types/
│   └── logging.types.ts              # LogMessage, ErrorLogMessage, etc.

core/error/
├── error.module.ts                    # Registers GlobalErrorFilter as APP_FILTER
├── filter/
│   └── global-error.filter.ts        # Catches all exceptions
├── domain/
│   └── domain-error-handler.ts       # Logging decision logic
├── loggable/
│   ├── error.loggable.ts             # Fallback wrapper for non-Loggable errors
│   └── axios-error.loggable.ts       # Axios-specific loggable exception
├── dto/                               # ErrorResponse DTOs
├── interface/                         # FeathersError interface, etc.
└── utils/                             # ErrorUtils (type guards)
```

---

## 9. Key Files Quick Reference

| Purpose | File |
|---------|------|
| **Loggable interface** | [loggable.ts](../apps/server/src/core/logger/interfaces/loggable.ts) |
| **Log message types** | [logging.types.ts](../apps/server/src/core/logger/types/logging.types.ts) |
| **Logger** (info/warning/notice/debug) | [logger.ts](../apps/server/src/core/logger/logger.ts) |
| **ErrorLogger** (error/crit/alert/emerg) | [error-logger.ts](../apps/server/src/core/logger/error-logger.ts) |
| **AuditLogger** | [audit-logger.ts](../apps/server/src/core/logger/audit-logger.ts) |
| **LegacyLogger** (deprecated) | [legacy-logger.service.ts](../apps/server/src/core/logger/legacy-logger.service.ts) |
| **LoggingUtils** | [logging.utils.ts](../apps/server/src/core/logger/logging.utils.ts) |
| **Logger config** | [logger.config.ts](../apps/server/src/core/logger/logger.config.ts) |
| **LoggerModule** | [logger.module.ts](../apps/server/src/core/logger/logger.module.ts) |
| **ErrorModule** | [error.module.ts](../apps/server/src/core/error/error.module.ts) |
| **GlobalErrorFilter** | [global-error.filter.ts](../apps/server/src/core/error/filter/global-error.filter.ts) |
| **DomainErrorHandler** | [domain-error-handler.ts](../apps/server/src/core/error/domain/domain-error-handler.ts) |
| **ErrorLoggable** (fallback) | [error.loggable.ts](../apps/server/src/core/error/loggable/error.loggable.ts) |
| **AxiosErrorLoggable** | [axios-error.loggable.ts](../apps/server/src/core/error/loggable/axios-error.loggable.ts) |
| **Request logger middleware** | [request-logger-middleware.ts](../apps/server/src/core/logger/request-logger-middleware.ts) |

---

## 10. Known Complexities & Gotchas

| Issue | Details |
|-------|---------|
| **No `error()` on Logger** | Intentional. All errors must flow through the exception filter. If you need to log something that's not an error, use `warning()`. |
| **ErrorLogger is restricted** | `ErrorLogger` may only be used inside the `ErrorModule`. Other modules must not inject it. |
| **Transient vs. Singleton** | `Logger` and `LegacyLogger` are transient (one instance per injection). `ErrorLogger` is singleton. `AuditLogger` is transient. |
| **AuditLogger has independent level** | It uses its own Winston instance, always at `info` level. Changing `NEST_LOG_LEVEL` does not affect it. |
| **`util.inspect` for serialization** | Log messages are serialized via `util.inspect()`, not `JSON.stringify()`. This handles circular references but produces Node-style output. |
| **Newlines stripped** | `LoggingUtils.stringifyMessage()` strips `\n` and `\\n` to keep log entries single-line. |
| **Loggable detection is duck-typed** | `isInstanceOfLoggable()` checks for `'getLogMessage' in object`, not `instanceof`. Any object with that method qualifies. |
| **HTTP context enrichment** | In HTTP requests, the error log automatically includes `userId`, HTTP method, endpoint, params, and query. For RPC/WS, only the error itself is logged. |
| **No unit tests for Loggables** | Current best practice — Loggables are simple data holders with no logic. Testing `getLogMessage()` adds no value. |
| **Response strips "Loggable"** | `GlobalErrorFilter` removes "Loggable" and "Exception" from the class name when building the error `type` for the API response. So `ForbiddenLoggableException` → `FORBIDDEN`. |

---

## 11. Suggested Exploration Order

For hands-on exploration after this presentation:

1. **Start with the interface:** Read `loggable.ts` and `logging.types.ts` — understand the `Loggable` contract and the three message types
2. **Read the Logger:** Read `logger.ts` — see how it accepts only `Loggable` and delegates to Winston
3. **Trace a log call:** Follow `logger.info()` → `LoggingUtils.createMessageWithContext()` → Winston → Console
4. **Build a Loggable:** Look at `UserLoginMigrationStartLoggable` as a minimal informational example
5. **Build a Loggable exception:** Look at `InvalidLinkUrlLoggableException` — extends `BadRequestException` + implements `Loggable`
6. **Trace the error pipeline:** Throw an exception → `GlobalErrorFilter.catch()` → `DomainErrorHandler.exec()` → check if Loggable → `ErrorLogger.error()` → also build HTTP response
7. **Understand the fallback:** Read `ErrorLoggable` — see how non-Loggable errors are wrapped and classified
8. **Explore the AuditLogger:** Read `audit-logger.ts` for the always-on audit trail pattern
9. **Check the config:** Read `logger.config.ts` to understand `NEST_LOG_LEVEL`, `EXIT_ON_ERROR`, `REQUEST_LOG_ENABLED`

---

## 12. External Documentation

- [Logging guidelines](https://documentation.dbildungscloud.dev/docs/backend-design-patterns/Coding-Guidelines/logging)
- [Exception handling guidelines](https://documentation.dbildungscloud.dev/docs/backend-design-patterns/Coding-Guidelines/exception-handling)
- [Architecture overview](https://documentation.dbildungscloud.dev/docs/backend-design-patterns/architecture)

---

*Document prepared for technical handover, July 2026*
