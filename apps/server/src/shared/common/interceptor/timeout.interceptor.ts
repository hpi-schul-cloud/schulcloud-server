import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { InterceptorConfig } from './interfaces';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	constructor(private readonly configService: ConfigService<InterceptorConfig, true>) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const reflector = new Reflector();
		const requestTimeoutEnvirementName =
			reflector.get<keyof InterceptorConfig>('requestTimeoutEnvirementName', context.getHandler()) ||
			reflector.get<keyof InterceptorConfig>('requestTimeoutEnvirementName', context.getClass());

		// type of requestTimeoutEnvirementName is always invalid and can be different
		const timeoutMS = this.configService.getOrThrow<number>(requestTimeoutEnvirementName || 'INCOMING_REQUEST_TIMEOUT');

		return next.handle().pipe(
			timeout(timeoutMS),
			catchError((err: Error) => {
				if (err instanceof TimeoutError) {
					return throwError(() => new RequestTimeoutException());
				}
				return throwError(() => err);
			})
		);
	}
}
