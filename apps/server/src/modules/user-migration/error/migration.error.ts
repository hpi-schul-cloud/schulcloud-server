import { BusinessError } from '@shared/common';
import { HttpStatus } from '@nestjs/common';
import { MigrationErrorCodeEnum } from './migration-error-code.enum';

export class MigrationError extends BusinessError {
	constructor(code?: MigrationErrorCodeEnum, message?: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'MIGRATION_ERROR',
				title: 'Migration failed',
				defaultMessage: `${code ?? 'migration_failed'}: ${message ?? 'Some error occurred during migration'}`,
			},
			HttpStatus.UNPROCESSABLE_ENTITY,
			details
		);
	}
}
