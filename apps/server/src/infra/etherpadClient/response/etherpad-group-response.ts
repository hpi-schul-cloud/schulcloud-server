import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { EtherpadBaseResponse } from './etherpad-base-response';
import { EtherpadGroupIdResponse } from './etherpad-group-id-response';

export class EtherpadGroupResponse extends EtherpadBaseResponse {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => EtherpadGroupIdResponse)
	data?: EtherpadGroupIdResponse;
}
