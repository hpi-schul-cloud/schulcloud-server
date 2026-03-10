import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MappedSvsRolle, PayloadRolle, ErwinRole } from './enums/rolle.enum';

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

	@IsEnum([MappedSvsRolle, ErwinRole])
	@IsNotEmpty()
	public role!: PayloadRolle;

	@IsEmail()
	@IsNotEmpty()
	public email!: string;

	@IsDateString()
	@IsNotEmpty()
	public geburtstag!: string;
}
