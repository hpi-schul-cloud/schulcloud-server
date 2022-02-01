import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { TokenRequestParams } from './token-request-params';

export class TokenRequestPayload {
	@IsDefined()
	@IsString()
	@IsNotEmpty()
	token_endpoint!: string;

	@IsDefined()
	@IsNotEmpty()
	tokenRequestParams!: TokenRequestParams;
}
