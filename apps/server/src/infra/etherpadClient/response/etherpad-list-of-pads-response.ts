import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { EtherpadBaseResponse } from './etherpad-base-response';
import { EtherpadPadsIdArrayResponse } from './etherpad-pads-id-array-response';

export class EtherpadAuthorPadsResponse extends EtherpadBaseResponse {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	data?: EtherpadPadsIdArrayResponse;
}
