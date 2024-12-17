import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';

export class TspJwtPayload implements JwtPayload {
	@IsString()
	@IsNotEmpty()
	public sub!: string;

	@IsOptional()
	@IsString()
	public sid: string | undefined;

	@IsString()
	@IsNotEmpty()
	public ptscListRolle!: string;

	@IsString()
	@IsNotEmpty()
	public personVorname!: string;

	@IsString()
	@IsNotEmpty()
	public personNachname!: string;

	@IsString()
	@IsNotEmpty()
	public ptscSchuleNummer!: string;

	@IsString()
	@IsOptional()
	public ptscListKlasseId?: string;

	constructor(data: Partial<TspJwtPayload>) {
		Object.assign(this, data);
	}
}
