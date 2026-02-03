import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { RequestTimeoutLoggableException } from '../../shared/common/loggable-exception';
import { TimeoutConfig } from './timeout-interceptor-config.interface';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	constructor(private readonly config: TimeoutConfig) {}

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const reflector = new Reflector();
		const requestTimeoutEnvironmentName =
			reflector.get<string>('requestTimeoutEnvironmentName', context.getHandler()) ||
			reflector.get<string>('requestTimeoutEnvironmentName', context.getClass());

		const timeoutMS = this.config[requestTimeoutEnvironmentName] ?? this.config.incomingRequestTimeout;

		const { url } = context.switchToHttp().getRequest<Request>();

		return next.handle().pipe(
			timeout(timeoutMS),
			catchError((err: Error) => {
				if (err instanceof TimeoutError) {
					return throwError(() => new RequestTimeoutLoggableException(url));
				}
				return throwError(() => err);
			})
		);
	}
}
