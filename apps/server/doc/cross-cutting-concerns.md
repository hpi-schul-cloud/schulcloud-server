# Cross cutting concerns

## Logging

For logging use the logger ServerLogger, provided by the logger module. It is hooked up in the application on startup, replacing the default logger and can be transient injected into any provider by additionally define set a context into the logger.

```TypeScript
// add Logger module to your feature module imports or unit tests
import { LoggerModule } from '../../logger/logger.module';
// ...
imports: [LoggerModule],

```

```TypeScript
// within of a provider (use-case, service, ...)

// import the server logger service
import { ServerLogger } from '../../logger/logger.service';

@Injectable()
export class YourUc {
	constructor(
		// initialize a ServerLogger
		private logger: ServerLogger
	) {
        // set the context by this class name (here: 'YourUc')
		this.logger.setContext(YourUc.name);
	}

	async sampleUcMethod(params) {
        this.logger.log(`start do something...`);
		// ...
        this.logger.log(`finished successfully to do something...`);
	}
```

This produces a logging output like

```
[Nest] NUMBER - TIME   [YourUc] start do something...
[Nest] NUMBER - TIME   [YourUc] finished successfully to do something...
```

Later we can filter the log for a single [context].

A logger does implement the LoggerService interface:

```TypeScript
interface LoggerService {
    log(message: any, context?: string): any;
    error(message: any, trace?: string, context?: string): any;
    warn(message: any, context?: string): any;
    debug?(message: any, context?: string): any;
    verbose?(message: any, context?: string): any;
}
```

Only a string should be provided as a single parameter by default. Ensure not putting complex objects into a log. Think about persisting more complex results for later analysis into a database.

Optionally in the second parameter, the context can be overridden only.
