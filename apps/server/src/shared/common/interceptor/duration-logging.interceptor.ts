import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * This interceptor is logging the duration of a REST call.
 */
@Injectable()
export class DurationLoggingInterceptor implements NestInterceptor {
	constructor(private logger: Logger) {
		logger.setContext(DurationLoggingInterceptor.name);
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		this.logger.verbose('Before...');
		const now = Date.now();
		return next.handle().pipe(tap(() => this.logger.verbose(`After... ${Date.now() - now}ms`)));
	}
}
