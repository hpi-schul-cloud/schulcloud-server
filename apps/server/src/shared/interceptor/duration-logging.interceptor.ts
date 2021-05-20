import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ServerLogger } from '../../modules/logger/logger.service';

@Injectable()
export class DurationLoggingInterceptor implements NestInterceptor {
	private readonly logger = new ServerLogger(DurationLoggingInterceptor.name);

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		this.logger.log('Before...');

		const now = Date.now();
		return next.handle().pipe(tap(() => this.logger.log(`After... ${Date.now() - now}ms`)));
	}
}
