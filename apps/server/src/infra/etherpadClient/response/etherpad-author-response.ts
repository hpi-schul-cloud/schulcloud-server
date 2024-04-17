import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { EtherpadBaseResponse } from './etherpad-base-response';
import { EtherpadAuthorIdResponse } from './etherpad-author-id-response';

export class EtherpadAuthorResponse extends EtherpadBaseResponse {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	data?: EtherpadAuthorIdResponse;
}
