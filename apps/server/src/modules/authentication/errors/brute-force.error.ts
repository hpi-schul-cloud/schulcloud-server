import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class BruteForceError extends BusinessError {
	readonly timeToWait: number;

	constructor(timeToWait: number, message: string) {
		super(
			// TODO: why is this ENTITY_NOT_FOUND?
			/* TODO: should be checked in general, also in regards to requirements.
			- How does this affect logins with external systems?
			- Can we do it in a less costly manner?
			- How can this be communicated in the API?
			- Can this be moved into the infrastructure?
			*/
			{ type: 'ENTITY_NOT_FOUND', title: 'Entity Not Found', defaultMessage: message },
			HttpStatus.TOO_MANY_REQUESTS,
			{
				timeToWait,
			}
		);
		this.timeToWait = timeToWait;
	}
}
