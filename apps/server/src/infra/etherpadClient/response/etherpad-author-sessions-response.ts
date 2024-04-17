import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { EtherpadBaseResponse } from './etherpad-base-response';
import { EtherpadSessionsArrayResponse } from './etherpad-sessions-array-response';

export class EtherpadAuthorSessionsResponse extends EtherpadBaseResponse {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	data?: EtherpadSessionsArrayResponse;
}
