import { IsString } from 'class-validator';

export class SchulconnexErreichbarkeitenResponse {
	@IsString()
	typ!: string;

	@IsString()
	kennung!: string;
}
