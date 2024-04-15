import { IsObject } from 'class-validator';
import { EtherpadBaseResponse } from './etherpad-base-response';

export class EtherpadDeleteResponse extends EtherpadBaseResponse {
	@IsObject()
	data?: null;
}
