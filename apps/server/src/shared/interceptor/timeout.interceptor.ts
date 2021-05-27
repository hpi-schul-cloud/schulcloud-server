import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/** This interceptor leaves the execution after a given timeoutMs, defaults to 5ms */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	constructor(private readonly timeoutMs: number = 5000) {}
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			timeout(this.timeoutMs),
			catchError((err) => {
				if (err instanceof TimeoutError) {
					return throwError(new RequestTimeoutException());
				}
				return throwError(err);
			})
		);
	}
}
