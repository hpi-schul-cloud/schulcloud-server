import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * This interceptor is logging the duration of a REST call.
 */
@Injectable()
export class DurationLoggingInterceptor implements NestInterceptor {
	constructor(private logger: LegacyLogger) {
		logger.setContext(DurationLoggingInterceptor.name);
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		this.logger.log('Before...');
		const now = Date.now();
		return next.handle().pipe(tap(() => this.logger.log(`After... ${Date.now() - now}ms`)));
	}
}
