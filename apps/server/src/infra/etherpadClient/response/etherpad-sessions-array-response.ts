import { IsArray, IsOptional } from 'class-validator';

export class EtherpadSessionsArrayResponse {
	@IsOptional()
	@IsArray()
	sessions?: Session[] | null;
}

export class Session {
	id?: string;

	authorID?: string;

	groupID?: string;

	validUntil?: number;

	constructor(id: string, authorID: string, groupID: string, validUntil: number) {
		this.id = id;
		this.authorID = authorID;
		this.groupID = groupID;
		this.validUntil = validUntil;
	}
}
