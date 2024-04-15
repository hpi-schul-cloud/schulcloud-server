import { IsOptional, IsString } from 'class-validator';

export class EtherpadGroupIdResponse {
	@IsOptional()
	@IsString()
	groupID?: string | null;
}
