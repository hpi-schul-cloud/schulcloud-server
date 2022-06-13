import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';

enum ErrorMessage {
	MULTIPLE_MATCHES_ARE_NOT_ALLOWED = 'MULTIPLE_MATCHES_ARE_NOT_ALLOWED',
}

export abstract class BaseSelectStrategie<T> {
	abstract match(layers: T[]);
}

export class SingleSelectStrategie<T> extends BaseSelectStrategie<T> {
	errorMessage = ErrorMessage;

	match(layers: T[]): T {
		if (layers.length === 0) {
			throw new NotImplementedException();
		}
		if (layers.length > 1) {
			throw new InternalServerErrorException(this.errorMessage.MULTIPLE_MATCHES_ARE_NOT_ALLOWED);
		}
		return layers[0];
	}
}
