import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { REQUEST_TIMEOUT } from './constants';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	protected static defaultTimeout = REQUEST_TIMEOUT;

	private _timeout?: number;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			timeout(this.timeout),
			catchError((err) => {
				if (err instanceof TimeoutError) {
					return throwError(new RequestTimeoutException());
				}
				return throwError(err);
			})
		);
	}

	get timeout(): number {
		return this._timeout || TimeoutInterceptor.defaultTimeout;
	}

	set timeout(milliseconds: number) {
		this._timeout = milliseconds;
	}
}
