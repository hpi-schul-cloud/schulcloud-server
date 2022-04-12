import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { IInterceptorConfig } from './interfaces';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	constructor(private readonly configService: ConfigService<IInterceptorConfig, true>) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const requestTimeout = this.configService.get('INCOMING_REQUEST_TIMEOUT', { infer: true });
		return next.handle().pipe(
			timeout(requestTimeout),
			catchError((err: Error) => {
				if (err instanceof TimeoutError) {
					return throwError(() => new RequestTimeoutException());
				}
				return throwError(() => err);
			})
		);
	}
}
