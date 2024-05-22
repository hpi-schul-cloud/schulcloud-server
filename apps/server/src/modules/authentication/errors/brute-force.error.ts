import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class BruteForceError extends BusinessError {
	readonly timeToWait: number;

	constructor(timeToWait: number, message: string) {
		super(
			// TODO: why is this ENTITY_NOT_FOUND? // done

			{ type: 'ENTITY_NOT_FOUND', title: 'Entity Not Found', defaultMessage: message },
			HttpStatus.TOO_MANY_REQUESTS,
			{
				timeToWait,
			}
		);
		this.timeToWait = timeToWait;
	}
}
