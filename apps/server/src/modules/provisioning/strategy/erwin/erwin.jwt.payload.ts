import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';

export class ErwinJwtPayload implements JwtPayload {
	@IsString()
	@IsNotEmpty()
	public sub!: string;

	@IsOptional()
	@IsString()
	public sid: string | undefined;

	@IsString()
	@IsNotEmpty()
	public erwinRole!: string;

	@IsString()
	@IsNotEmpty()
	public personVorname!: string;

	@IsString()
	@IsNotEmpty()
	public personNachname!: string;

	@IsString()
	@IsNotEmpty()
	public erwinSchuleNummer!: string;

	@IsString()
	@IsOptional()
	public erwinKlasseIds?: string;

	constructor(data: Partial<ErwinJwtPayload>) {
		Object.assign(this, data);
	}
}
