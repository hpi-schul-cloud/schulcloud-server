# Logging

For logging use the Logger, exported by the logger module. It encapsulates a [Winston](https://github.com/winstonjs/winston) logger. Its [injection scope](https://docs.nestjs.com/fundamentals/injection-scopes) is transient, so you can set a context when you inject it.

For better privacy protection and searchability of logs, the logger cannot log arbitrary strings but only so called __loggables__. If you want to log something you have to use or create a loggable that implements the `Loggable` interface.

The message should be fixed in each loggable. If you want to log further data, put in the data field of the `LogMessage`, like in the example below.

```TypeScript
export class YourLoggable implements Loggable {
	constructor(private readonly userId: EntityId) {}

	getLogMessage(): LogMessage {
		return {
			message: 'I am a log message.',
			data: { userId: this.userId, },
		};
	}
}

```

```TypeScript
import { Logger } from '@src/core/logger';

export class YourUc {
	constructor(private logger: Logger) {
		this.logger.setContext(YourUc.name);
	}

	public sampleUcMethod(user) {
		this.logger.log(new YourLoggable(userId: user.id));
	}
}
```

This produces a logging output like

```
[NestWinston] Info - 2023-05-31 15:20:30.888   [YourUc] {  message: 'I am a log message.',  data: {   userId: '0000d231816abba584714c9e'  }}
```

## Log levels and error logging

The logger exposes the methods `log`, `warn`, `debug` and `verbose`. It does not expose an `error` method because we don't want errors to be logged manually. All errors are logged in the exception filter.

## Legacy logger

While transitioning to the new logger for loggables, the old logger for strings is still available as `LegacyLogger`.