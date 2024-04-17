import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { EtherpadBaseResponse } from './etherpad-base-response';
import { EtherpadAuthorsIdArrayResponse } from './etherpad-authors-id-array-response';

export class EtherpadAuthorsOfPadResponse extends EtherpadBaseResponse {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	data?: EtherpadAuthorsIdArrayResponse;
}
