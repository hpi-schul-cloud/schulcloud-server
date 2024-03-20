import { IsString } from 'class-validator';

export class SanisErreichbarkeitenResponse {
	@IsString()
	typ!: string;

	@IsString()
	kennung!: string;
}
