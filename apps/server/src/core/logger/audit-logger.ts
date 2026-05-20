import { Inject, Injectable, Scope } from '@nestjs/common';
import { Logger as WinstonLogger } from 'winston';

export const AUDIT_LOGGER_PROVIDER = 'AUDIT_LOGGER_PROVIDER';

/**
 * AuditLogger is an independent logger that always logs at 'info' level,
 * regardless of the application's configured log level.
 *
 * Use this for audit trails, service account actions, and other events
 * that must always be recorded.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AuditLogger {
	private readonly context = `[AUDIT]`;

	constructor(@Inject(AUDIT_LOGGER_PROVIDER) private readonly logger: WinstonLogger) {}

	private log(actor: string, action: string, details: Record<string, unknown> = {}): void {
		const message = `${this.context} Actor: ${actor} | Action: ${action}`;

		this.logger.info({ message, ...details });
	}

	public logServiceAccountAction(
		serviceAccountId: string,
		action: string,
		details: Record<string, unknown> = {}
	): void {
		this.log(`ServiceAccount: ${serviceAccountId}`, action, details);
	}
}
