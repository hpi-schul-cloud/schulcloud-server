import { LoggingUtils } from '@infra/logger';
import { HttpException, HttpStatus } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type AxiosError } from 'axios';
import util from 'node:util';

export class AxiosErrorLoggable extends HttpException implements Loggable {
	private static isSensitiveHeaderName(name: string): boolean {
		const lower = name.toLowerCase();

		return (
			lower.includes('cookie') ||
			lower.startsWith('x-api') ||
			lower.includes('auth') ||
			lower.includes('token') ||
			lower.includes('secret')
		);
	}

	private readonly axiosError: AxiosError;
	protected readonly type: string;

	constructor(axiosError: AxiosError, type: string) {
		super(axiosError.message, axiosError.status ?? HttpStatus.INTERNAL_SERVER_ERROR, {
			cause: axiosError.cause,
		});

		this.axiosError = this.redactAxiosError(axiosError);
		this.type = type;
	}

	public getLogMessage(): LoggableMessage {
		return {
			message: `message: ${this.axiosError.message} code: ${this.axiosError.code || 'Unknown code'}`,
			type: this.type,
			data: util.inspect(this.axiosError.response?.data),
			stack: this.stack,
		};
	}

	public [util.inspect.custom](): unknown {
		return {
			name: this.name,
			message: this.message,
			status: this.getStatus(),
			type: this.type,
			axiosError: {
				message: this.axiosError.message,
				code: this.axiosError.code,
				status: this.axiosError.status,
				config: {
					url: this.axiosError.config?.url,
					method: this.axiosError.config?.method,
					headers: this.axiosError.config?.headers,
				},
				response: {
					status: this.axiosError.response?.status,
					statusText: this.axiosError.response?.statusText,
					data: this.axiosError.response?.data,
					headers: this.axiosError.response?.headers,
				},
			},
		};
	}

	private redactAxiosError(axiosError: AxiosError): AxiosError {
		const redactedConfig = axiosError.config
			? {
					...axiosError.config,
					headers: this.redactHeaders(axiosError.config.headers),
				}
			: axiosError.config;

		const redactedResponse = axiosError.response
			? {
					...axiosError.response,
					data: LoggingUtils.redactSensitiveValue(axiosError.response.data),
					headers: this.redactHeaders(axiosError.response.headers),
				}
			: axiosError.response;

		const redactedAxiosError = {
			...axiosError,
			config: redactedConfig,
			response: redactedResponse,
		} as AxiosError;

		// Keep JSON serialization safe even if this object is stringified outside LoggingUtils/util.inspect.
		const originalToJson = axiosError.toJSON?.bind(axiosError);
		redactedAxiosError.toJSON = (): object => {
			const baseValue = originalToJson ? originalToJson() : {};
			if (typeof baseValue !== 'object' || baseValue === null) {
				return {};
			}

			const baseRecord = baseValue as Record<string, unknown>;
			return {
				...baseRecord,
				config: this.redactHeadersInConfig(baseRecord.config),
				response: this.redactResponse(baseRecord.response),
			};
		};

		return redactedAxiosError;
	}

	private redactHeadersInConfig(config: unknown): unknown {
		if (typeof config !== 'object' || config === null) {
			return config;
		}

		const configRecord = config as Record<string, unknown>;
		return {
			...configRecord,
			headers: this.redactHeaders(configRecord.headers),
		};
	}

	private redactResponse(response: unknown): unknown {
		if (typeof response !== 'object' || response === null) {
			return response;
		}

		const responseRecord = response as Record<string, unknown>;
		return {
			...responseRecord,
			data: LoggingUtils.redactSensitiveValue(responseRecord.data),
			headers: this.redactHeaders(responseRecord.headers),
		};
	}

	private redactHeaders(headers: unknown): unknown {
		if (Array.isArray(headers)) {
			return headers.map((entry) => this.redactHeaderValue(entry));
		}

		if (typeof headers !== 'object' || headers === null) {
			return headers;
		}

		const headerRecord = headers as Record<string, unknown>;
		const redactedHeaders = Object.entries(headerRecord).reduce<Record<string, unknown>>((result, [key, value]) => {
			result[key] = AxiosErrorLoggable.isSensitiveHeaderName(key) ? this.redactHeaderValue(value) : value;
			return result;
		}, {});

		return redactedHeaders;
	}

	private redactHeaderValue(value: unknown): unknown {
		if (Array.isArray(value)) {
			return value.map((entry) => this.redactHeaderValue(entry));
		}

		if (typeof value !== 'string') {
			return '[REDACTED]';
		}

		const trimmedValue = value.trim();
		const [scheme, credential, ...rest] = trimmedValue.split(/\s+/);
		if (credential && rest.length === 0) {
			return `${scheme} ${this.maskSecret(credential)}`;
		}

		return this.maskSecret(trimmedValue);
	}

	private maskSecret(secret: string): string {
		if (secret.length <= 8) {
			return '[REDACTED]';
		}

		return `${secret.slice(0, 4)}...${secret.slice(-2)} [REDACTED]`;
	}
}
