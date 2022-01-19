import { IsDefined, IsString } from 'class-validator';

export class AuthorizationErrorQuery {
	@IsString()
	@IsDefined()
	error!: string;
}
