import { IsString, IsOptional, IsArray } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';

export class TspJwtPayload implements JwtPayload {
	@IsString()
	public sub!: string;

	@IsOptional()
	@IsString()
	public sid: string | undefined;

	@IsOptional()
	@IsString()
	public ptscListRolle: string | undefined;

	@IsOptional()
	@IsString()
	public personVorname: string | undefined;

	@IsOptional()
	@IsString()
	public personNachname: string | undefined;

	@IsOptional()
	@IsString()
	public ptscSchuleNummer: string | undefined;

	@IsOptional()
	@IsArray()
	public ptscListKlasseId: [] | undefined;

	constructor(data: Partial<TspJwtPayload>) {
		Object.assign(this, data);
	}
}
