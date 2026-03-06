import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { PayloadRolle } from './enums/rolle.enum';

export class ErwinPersonPayload {
	@IsNotEmpty()
	@IsString()
	public externalId!: string;

	@IsString()
	@IsNotEmpty()
	public firstName!: string;

	@IsString()
	@IsNotEmpty()
	public lastName!: string;

	@IsString()
	@IsNotEmpty()
	public role!: PayloadRolle;

	@IsString()
	@IsNotEmpty()
	public email!: string;

	@IsDate()
	@IsNotEmpty()
	public geburtstag!: string;

	constructor(payload: Partial<ErwinPersonPayload>) {
		Object.assign(this, payload);
	}
}
