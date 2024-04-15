import { IsOptional, IsString } from 'class-validator';

export class EtherpadAuthorIdResponse {
	@IsOptional()
	@IsString()
	authorID?: string | null;
}
