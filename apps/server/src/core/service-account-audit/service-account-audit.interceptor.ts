import { AuditLogger } from '@infra/logger';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

interface ServiceAccountUser {
	userId: string;
	isServiceAccount: boolean;
}

interface RequestWithUser extends Request {
	user?: ServiceAccountUser;
}

/**
 * Interceptor that logs all API calls made by service accounts.
 * This interceptor is applied globally and only logs requests
 * where the authenticated user is a service account.
 */
@Injectable()
export class ServiceAccountAuditInterceptor implements NestInterceptor {
	constructor(private readonly auditLogger: AuditLogger) {}

	public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		if (context.getType() !== 'http') {
			return next.handle();
		}

		const request = context.switchToHttp().getRequest<RequestWithUser>();
		const { user } = request;

		if (!user?.isServiceAccount) {
			return next.handle();
		}

		const { method, originalUrl } = request;

		return next.handle().pipe(
			tap({
				next: (): void => {
					const response = context.switchToHttp().getResponse<Response>();
					this.logApiCall(user.userId, method, originalUrl, response.statusCode);
				},
				error: (error: Error & { status?: number }): void => {
					const statusCode = error.status ?? 500;
					this.logApiCall(user.userId, method, originalUrl, statusCode, { error: error.message });
				},
			})
		);
	}

	private logApiCall(
		serviceAccountId: string,
		method: string,
		path: string,
		statusCode: number,
		details: Record<string, unknown> = {}
	): void {
		this.auditLogger.logServiceAccountApiCall(serviceAccountId, method, path, statusCode, details);
	}
}
