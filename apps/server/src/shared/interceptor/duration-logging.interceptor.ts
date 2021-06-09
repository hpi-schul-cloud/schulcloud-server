import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '../../core/logger/logger.service';

/**
 * This interceptor is logging the duration of a REST call.
 */
@Injectable()
export class DurationLoggingInterceptor implements NestInterceptor {
	private readonly logger = new Logger(DurationLoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		this.logger.verbose('Before...');
		const now = Date.now();
		return next.handle().pipe(tap(() => this.logger.verbose(`After... ${Date.now() - now}ms`)));
	}
}
