import { IsNotEmpty, IsString } from 'class-validator';

export class ErwinKlassePayload {
	@IsString()
	@IsNotEmpty()
	public externalId!: string;

	@IsString()
	@IsNotEmpty()
	public erwinId!: string;

	@IsString()
	@IsNotEmpty()
	public name!: string;
}
