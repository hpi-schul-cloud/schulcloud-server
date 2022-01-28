import { IsDefined } from 'class-validator';
import { Data } from './data';

export class Payload {
	@IsDefined()
	token_endpoint!: string;

	@IsDefined()
	data!: Data;
}
