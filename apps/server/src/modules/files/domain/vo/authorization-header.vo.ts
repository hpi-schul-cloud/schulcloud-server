import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsJWT } from 'class-validator';

@ValueObject()
export class AuthorizationTokenVo {
	@IsJWT()
	public readonly jwt: string;

	constructor(jwt: string) {
		this.jwt = jwt;
	}
}
