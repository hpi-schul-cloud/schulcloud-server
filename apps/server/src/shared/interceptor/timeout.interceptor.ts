import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	protected static readonly defaultTimeout = 5000;
	// constructor(private readonly timeoutMs: number = 5000) {}
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			timeout(TimeoutInterceptor.defaultTimeout),
			catchError((err) => {
				if (err instanceof TimeoutError) {
					return throwError(new RequestTimeoutException());
				}
				return throwError(err);
			})
		);
	}
}
