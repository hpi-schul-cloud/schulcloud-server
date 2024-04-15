import { IsArray, IsOptional } from 'class-validator';

export class EtherpadAuthorsIdArrayResponse {
	@IsOptional()
	@IsArray()
	authorIDs?: string[] | null;
}
