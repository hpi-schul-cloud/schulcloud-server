import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';
import { ErwinKlassePayload } from './erwin.klasse.payload';
import { ErwinPersonPayload } from './erwin.person.payload';
import { ErwinSchulePayload } from './erwin.schule.payload';

export class ErwinJwtPayload implements JwtPayload {
	@IsUUID()
	@IsNotEmpty()
	public sub!: string;

	@ValidateNested()
	public person!: ErwinPersonPayload;

	@ValidateNested()
	public schule!: ErwinSchulePayload;

	@IsArray()
	@IsNotEmpty()
	public klassen!: ErwinKlassePayload[];

	constructor(data: Partial<ErwinJwtPayload>) {
		Object.assign(this, data);
	}
}
