import { IsDefined, IsString } from 'class-validator';

export class AuthorizationCodeQuery {
	@IsDefined()
	@IsString()
	code!: string;
}
