import { IsString } from 'class-validator';

export class SchulconnexErreichbarkeitenResponse {
	@IsString()
	public typ!: string;

	@IsString()
	public kennung!: string;
}
