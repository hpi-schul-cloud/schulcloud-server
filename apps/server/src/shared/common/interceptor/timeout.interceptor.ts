import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { TypeGuard } from '../guards';
import { RequestTimeoutLoggableException } from '../loggable-exception';
import { InterceptorConfig } from './interfaces';

/**
 * This interceptor leaves the request execution after a given timeout in ms.
 * This will not stop the running services behind the controller.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	defaultConfigKey: keyof InterceptorConfig = 'INCOMING_REQUEST_TIMEOUT';

	constructor(private readonly configService: ConfigService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const reflector = new Reflector();
		const requestTimeoutEnvironmentName =
			reflector.get<string>('requestTimeoutEnvironmentName', context.getHandler()) ||
			reflector.get<string>('requestTimeoutEnvironmentName', context.getClass());

		// type of requestTimeoutEnvironmentName is always invalid and can be different
		const timeoutMS = this.configService.getOrThrow<number>(requestTimeoutEnvironmentName || this.defaultConfigKey);

		TypeGuard.checkNumber(timeoutMS);

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
