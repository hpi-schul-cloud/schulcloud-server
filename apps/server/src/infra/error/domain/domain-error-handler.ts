import { ICurrentUser } from '@infra/auth-guard';
import {
	Logger,
	LoggingUtils,
	redactSecretPathParams,
	redactSecretQueryParams,
	redactSecretsInText,
	redactSecretsInUrl,
} from '@infra/logger';
import { Injectable } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Loggable, LogMessageDataObject } from '@shared/common/loggable';
import { Request } from 'express';
import util from 'node:util';
import { ErrorLoggable } from '../loggable';

@Injectable()
export class DomainErrorHandler {
	constructor(private readonly logger: Logger) {}

	public exec(error: unknown): void {
		const loggable = this.createErrorLoggable(error);
		this.logger.error(loggable);
	}

	public execHttpContext(error: unknown, context: HttpArgumentsHost): void {
		const request: Request = context.getRequest();
		const user = request.user as ICurrentUser | undefined;
		const requestInfo = {
			userId: user?.userId,
			request: {
				method: request.method,
				endpoint: redactSecretsInUrl(request.url),
				params: redactSecretPathParams(request.params),
				query: redactSecretQueryParams(request.query),
			},
		};
		const loggable = this.createErrorLoggable(error, requestInfo);

		this.logger.error(loggable);
	}

	private createErrorLoggable(error: unknown, data?: LogMessageDataObject): Loggable {
		let loggable: Loggable;

		if (LoggingUtils.isInstanceOfLoggable(error)) {
			loggable = error;
		} else if (error instanceof Error) {
			loggable = new ErrorLoggable(this.redactUrlSecretsInError(error), data);
		} else {
			const unknownError = new Error(util.inspect(error));
			loggable = new ErrorLoggable(unknownError, data);
		}

		return loggable;
	}

	/**
	 * Nest's 404 for an unknown route has the raw URL in its message, stack and response ("Cannot GET /sharetoken/abc").
	 * Returns a copy with URL secrets redacted in those texts. The thrown error itself is not changed.
	 */
	private redactUrlSecretsInError(error: Error): Error {
		const copy = Object.create(Object.getPrototypeOf(error) as object) as Error;

		for (const key of Object.getOwnPropertyNames(error)) {
			const descriptor = Object.getOwnPropertyDescriptor(error, key);
			if (descriptor) {
				// stack is an accessor in V8 that only works on the original error, so its value is read and copied.
				const value: unknown = error[key as keyof Error];
				Object.defineProperty(copy, key, {
					value: this.redactUrlSecretsInValue(value),
					enumerable: descriptor.enumerable,
					writable: true,
					configurable: true,
				});
			}
		}

		return copy;
	}

	// Strings, arrays of strings and the plain response object of an HttpException ({ message, error, statusCode }).
	private redactUrlSecretsInValue(value: unknown): unknown {
		if (typeof value === 'string') {
			return redactSecretsInText(value);
		}

		if (Array.isArray(value)) {
			return value.map((item: unknown) => (typeof item === 'string' ? redactSecretsInText(item) : item));
		}

		if (typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
			return Object.fromEntries(
				Object.entries(value).map(([key, item]) => [key, typeof item === 'string' ? redactSecretsInText(item) : item])
			);
		}

		return value;
	}
}
