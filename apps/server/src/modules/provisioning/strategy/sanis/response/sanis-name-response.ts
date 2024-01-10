import { IsString } from 'class-validator';

export class SanisNameResponse {
	@IsString()
	familienname!: string;

	@IsString()
	vorname!: string;
}
