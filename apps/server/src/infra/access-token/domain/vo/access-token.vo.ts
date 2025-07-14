import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsUUID } from 'class-validator';
import { randomUUID } from 'crypto';

@ValueObject()
export class AccessToken {
	constructor() {
		this.token = randomUUID();
	}

	@IsUUID()
	public readonly token: string;
}
