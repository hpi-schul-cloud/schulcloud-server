import { IsString, IsNotEmpty } from 'class-validator';

export class ErwinKlassePayload {
	@IsString()
	@IsNotEmpty()
	public externalId!: string;

	@IsString()
	@IsNotEmpty()
	public name!: string;

	constructor(externalId: string, name: string) {
		this.externalId = externalId;
		this.name = name;
	}
}
