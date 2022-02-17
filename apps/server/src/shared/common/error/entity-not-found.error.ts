import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class EntityNotFoundError extends BusinessError {
	constructor(readonly entityName: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'ENTITY_NOT_FOUND',
				title: 'Entity Not Found',
				defaultMessage: `${entityName} entity not found.`,
			},
			HttpStatus.NOT_FOUND,
			details
		);
	}
}
