import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { RequestTimeoutLoggableException } from '../../shared/common/loggable-exception';
import { MergedTimeoutConfig } from './config-merger';
import { DEFAULT_TIMEOUT_CONFIG_TOKEN } from './default-timeout.config';
import { TIMEOUT_CONFIG_REGISTRY } from './timeout-config.registry';
import { TimeoutConfig } from './timeout-interceptor-config.interface';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	private mergedConfig?: TimeoutConfig;

	constructor(
		@Inject(DEFAULT_TIMEOUT_CONFIG_TOKEN) private readonly defaultConfig: TimeoutConfig,
		private readonly moduleRef: ModuleRef
	) {}

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (!this.mergedConfig) {
			this.mergedConfig = this.mergeConfigs();
		}

		const configKey = this.getConfigKey(context);
		const timeoutMS = configKey ? this.mergedConfig[configKey] : this.mergedConfig.incomingRequestTimeout;

		if (timeoutMS === undefined) this.throwMissingKeyError(configKey);

		const { url } = context.switchToHttp().getRequest<Request>();

		return this.handleTimeout(next, timeoutMS, url);
	}

	private handleTimeout(next: CallHandler, timeoutMS: number, url: string): Observable<unknown> {
		return next.handle().pipe(
			timeout(timeoutMS),
			catchError((err: Error) => this.handleTimeoutError(err, url))
		);
	}

	private handleTimeoutError(err: Error, url: string): Observable<never> {
		if (err instanceof TimeoutError) {
			return throwError(() => new RequestTimeoutLoggableException(url));
		}
		return throwError(() => err);
	}

	private throwMissingKeyError(key?: string): void {
		const resolvedKey = key ?? 'MISSING_KEY';

		throw new Error(
			`Timeout configuration key "${resolvedKey}" is not registered in any TimeoutConfig. ` +
				`Please ensure the key is defined as a property in a TimeoutConfig class and the config is registered with @RegisterTimeoutConfig.`
		);
	}

	private getConfigKey(context: ExecutionContext): string | undefined {
		const reflector = new Reflector();
		const configKey =
			reflector.get<string>('requestTimeoutEnvironmentName', context.getHandler()) ||
			reflector.get<string>('requestTimeoutEnvironmentName', context.getClass());

		return configKey;
	}

	private mergeConfigs(): TimeoutConfig {
		const tokens = TIMEOUT_CONFIG_REGISTRY.getTokens();
		const configs: TimeoutConfig[] = [this.defaultConfig];

		for (const token of tokens) {
			const config = this.moduleRef.get<TimeoutConfig>(token, { strict: false });
			configs.push(config);
		}

		const merged = new MergedTimeoutConfig(configs);

		return merged;
	}
}
