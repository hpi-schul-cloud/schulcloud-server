import { IsString, IsOptional, IsArray } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';

export class TspJwtPayload implements JwtPayload {
	@IsString()
	public sub!: string;

	@IsOptional()
	@IsString()
	public sid!: string;

	@IsOptional()
	@IsString()
	public ptscListRolle!: string;

	@IsOptional()
	@IsString()
	public personVorname!: string;

	@IsOptional()
	@IsString()
	public personNachname!: string;

	@IsOptional()
	@IsString()
	public ptscSchuleNummer!: string;

	@IsOptional()
	@IsArray()
	public ptscListKlasseId!: [];

	constructor(data: Partial<TspJwtPayload>) {
		Object.assign(this, data);
	}
}
