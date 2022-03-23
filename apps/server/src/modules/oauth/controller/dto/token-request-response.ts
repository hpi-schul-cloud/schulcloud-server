import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { TokenRequestParams } from './token-request-params';

export class TokenRequestResponse {
	@IsDefined()
	@IsString()
	@IsNotEmpty()
	tokenEndpoint!: string;

	@IsDefined()
	@IsNotEmpty()
	tokenRequestParams!: TokenRequestParams;
}
