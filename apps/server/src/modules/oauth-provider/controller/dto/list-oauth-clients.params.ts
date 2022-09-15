import { IsNumber, IsString, Max, Min } from 'class-validator';

export class ListOauthClientsParams {
	@IsNumber()
	@Min(0)
	@Max(500)
	limit?: number;

	@IsNumber()
	@Min(0)
	offset?: number;

	@IsString()
	client_name?: string;

	@IsString()
	owner?: string;
}
