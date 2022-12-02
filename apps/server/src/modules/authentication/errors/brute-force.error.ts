import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';

export class BruteForceError extends BusinessError {
	private _timeToWait: number;

	constructor(timeToWait: number, message: string) {
		super(
			{ type: 'ENTITY_NOT_FOUND', title: 'Entity Not Found', defaultMessage: message },
			HttpStatus.TOO_MANY_REQUESTS,
			{
				timeToWait,
			}
		);
		this._timeToWait = timeToWait;
	}

	get timeToWait() {
		return this._timeToWait;
	}
}
