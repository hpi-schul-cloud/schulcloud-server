import { IsDefined, IsString } from 'class-validator';

export class AuthorizationCodeQuery {
	code!: string;
}
