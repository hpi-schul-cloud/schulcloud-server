import { IsDefined } from 'class-validator';
import { Data } from './data';

export class Payload {
	@IsDefined()
	tokenEndpoint!: string | undefined;

	@IsDefined()
	data!: Data;
}
