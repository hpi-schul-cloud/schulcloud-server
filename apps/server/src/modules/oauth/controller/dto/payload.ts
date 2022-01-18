import { IsDefined } from 'class-validator';
import { Data } from './data';

export class Payload {
	@IsDefined()
	tokenEndpoint!: string;

	@IsDefined()
	data!: Data;
}
