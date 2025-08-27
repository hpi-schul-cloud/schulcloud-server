import { ValueObject } from '@shared/domain/value-object.decorator';
import { Matches } from 'class-validator';
import { nanoid } from 'nanoid';

type NanoidString24Chars = string;
export const accessTokenRegex = /^[a-zA-Z0-9_-]{24}$/;

@ValueObject()
export class AccessToken {
	constructor() {
		this.token = nanoid(24);
	}

	@Matches(accessTokenRegex, { message: 'Token must be a valid string.' })
	public readonly token: NanoidString24Chars;
}
