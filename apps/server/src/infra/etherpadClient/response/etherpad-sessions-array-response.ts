import { IsArray, IsOptional } from 'class-validator';

export class EtherpadSessionsArrayResponse {
	@IsOptional()
	@IsArray()
	sessions?: Session[] | null;
}

class Session {
	id?: string;

	authorID?: string;

	groupID?: string;

	validUntil?: number;
}
