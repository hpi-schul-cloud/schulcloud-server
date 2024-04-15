import { IsArray, IsOptional } from 'class-validator';

export class EtherpadPadsIdArrayResponse {
	@IsOptional()
	@IsArray()
	padIDs?: string[] | null;
}
