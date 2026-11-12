# Logging

For logging use the `Logger`, exported by `@infra/logger`. It encapsulates a [Winston](https://github.com/winstonjs/winston) logger. Its [injection scope](https://docs.nestjs.com/fundamentals/injection-scopes) is transient, so every class gets its own instance.

## Logging a message

Pass a fixed message and, optionally, an object with further data:

```TypeScript
import { Logger } from '@infra/logger';

@Injectable()
export class BoardCopyService {
	constructor(private readonly logger: Logger) {}

	public async copyBoard(boardId: EntityId): Promise<void> {
		// ...
		this.logger.info('Board copied', { boardId });
	}
}
```

Keep the message fixed and put everything that varies into the data object. That way all entries of one kind can be found by their message, and the values can be filtered as fields. Pass objects and arrays as they are, don't `JSON.stringify` them: they end up as nested JSON in the log, a string would be JSON inside JSON.

Log IDs, not personal data: no names, email addresses or content written by users.

### Log levels

The logger uses the syslog levels. From most to least severe it exposes:

| Method                    | Use for                                                   |
| ------------------------- | --------------------------------------------------------- |
| `error(message, data?)`   | an error that was caught and handled, e.g. a failed retry |
| `warning(message, data?)` | something unexpected that the application can live with   |
| `notice(message, data?)`  | important events, e.g. a job started or finished          |
| `info(message, data?)`    | normal events                                             |
| `debug(message, data?)`   | details only needed when looking into a problem           |

Thrown errors don't need to be logged by hand. The global error filter logs them, see [Exception Handling](./exception-handling.md).

## Context and module

Every entry carries the class that logs it as `context` and the Nest module providing that class as `module`. Both are set automatically.

`setContext()` overrides the context, e.g. for code outside a Nest provider. Code that already calls `setContext()` keeps working.

When the logger is injected into a factory (`useFactory`), there is no class to take the name from. Call `setContext()` there.

## Output format

Every environment writes one JSON object per line, with the fields `timestamp`, `level`, `context`, `module`, `message`, and if present `data` and `error`, followed by any further fields. Locally you see the same format as in the deployments.

```
{"timestamp":"2026-11-03T11:55:09.671Z","level":"info","context":"BoardCopyService","module":"BoardModule","message":"Board copied","data":{"boardId":"0000d231816abba584714c9e"}}
```

To read it locally, pipe the output through `jq`, e.g. `npm run nest:start:dev | jq -R 'fromjson? // .'` (lines that are not JSON are printed as they are).

The fields `trace_id` and `span_id` are reserved for tracing (OpenTelemetry) and are removed from entries until then.

## Configuring log levels

`NEST_LOG_LEVEL` sets the level for the whole application (default `notice`).

`LOG_LEVELS` sets levels per module or class:

```
LOG_LEVELS="default=notice,BoardModule=debug,BoardCopyService=warning"
```

- A class rule wins over a module rule, a module rule over `default`.
- Without `default`, `NEST_LOG_LEVEL` applies.
- The names are the ones shown as `context` and `module` in the log, so Nest's own contexts like `RouterExplorer` work as well.
- An invalid value stops the start with a message showing the expected format.

## Sensitive data

The logger redacts some values on its own:

- values of fields whose name contains `auth`, `token`, `secret` or `cookie`, or starts with `x-api`
- bearer tokens in strings
- errors from HTTP calls (axios): only method, URL (without credentials and sensitive query parameters), status, error code and the start of the response body are logged, never headers, request body or config

Config values marked with `@Secret()` are replaced with `***` in every log line, wherever they appear, including inside `Basic` auth headers:

```TypeScript
@ConfigProperty('ETHERPAD__API_KEY')
@Secret()
@IsString()
public apiKey = 'defaultApiKey';
```

Mark every config property that holds a password, key or token. Values shorter than 8 characters are not masked, because they would also match normal text.

This does not cover secrets from the legacy Feathers config (`default.schema.json`), secrets stored in the database, or passwords inside connection URIs (e.g. `DB_URL`). Don't log those.

## Loggables

Before the simple API above, the logger only accepted **loggables**: classes implementing the `Loggable` interface that build the log message. The logger still accepts them, e.g. `this.logger.info(new YourLoggable(userId))`.

Don't write new loggable classes. A lint rule forbids them. Exceptions that implement `Loggable` to add data to their error log are still fine, see [Exception Handling](./exception-handling.md).

Existing loggables are listed in `eslint.legacy-loggables.js`. When you work on code that uses one, replace it with a plain log call, delete the loggable and remove it from that list. They are not converted as a separate project. The list can only shrink: `apps/server/src/infra/logger/legacy-loggables.spec.ts` fails if it gets a new entry or still lists a file whose loggable is gone.

## Legacy logger

The old logger for strings is still available as `LegacyLogger`. Nest uses it for its own logs, e.g. at startup. It writes the same format. Use `Logger` in new code.
