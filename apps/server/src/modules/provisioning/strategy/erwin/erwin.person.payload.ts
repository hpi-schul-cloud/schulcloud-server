import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ErwinRole, MappedSvsRolle, PayloadRolle } from './enums/rolle.enum';
import { Expose } from 'class-transformer';

export class ErwinPersonPayload {
	@IsNotEmpty()
	@IsString()
	public externalId!: string;

	@IsString()
	@IsNotEmpty()
	public erwinId!: string;

	@IsString()
	@IsNotEmpty()
	@Expose({ name: 'vorname' })
	public firstName!: string;

	@IsString()
	@IsNotEmpty()
	@Expose({ name: 'familienname' })
	public lastName!: string;

	@IsEnum([
		MappedSvsRolle.ADMIN,
		MappedSvsRolle.STUDENT,
		MappedSvsRolle.SUPERHERO,
		MappedSvsRolle.TEACHER,
		MappedSvsRolle.USER,
		ErwinRole.LEHR,
		ErwinRole.LERN,
		ErwinRole.LEIT,
	])
	@IsNotEmpty()
	@Expose({ name: 'rolle' })
	public role!: PayloadRolle;

	@IsEmail()
	@IsNotEmpty()
	public email!: string;

	@IsDateString()
	@IsNotEmpty()
	@IsOptional()
	@Expose({ name: 'geburtsdatum' })
	public geburtstag?: string;
}
