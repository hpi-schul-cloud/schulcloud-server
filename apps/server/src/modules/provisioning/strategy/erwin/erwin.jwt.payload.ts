import { IsArray, IsDefined, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';
import { ErwinKlassePayload } from './erwin.klasse.payload';
import { ErwinPersonPayload } from './erwin.person.payload';
import { ErwinSchulePayload } from './erwin.schule.payload';

export class ErwinJwtPayload implements JwtPayload {
	@IsUUID()
	@IsNotEmpty()
	public sub!: string;

	@ValidateNested()
	@IsDefined()
	public person!: ErwinPersonPayload;

	@ValidateNested()
	@IsDefined()
	public schule!: ErwinSchulePayload;

	@ValidateNested()
	@IsArray()
	public klassen?: ErwinKlassePayload[];

	constructor(data: Partial<ErwinJwtPayload>) {
		Object.assign(this, data);
	}
}
