import { ErwinRole } from '../../../role/domain/type/rolename.enum';
import { IsArray, IsDate, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { JwtPayload } from 'jsonwebtoken';
import { ErwinKlassePayload } from './erwin.klasse.payload';

export class ErwinJwtPayload implements JwtPayload {
	@IsUUID()
	@IsNotEmpty()
	public sub!: string;

	@IsNotEmpty()
	@IsString()
	public personExternalId!: string;

	@IsString()
	@IsNotEmpty()
	public personFirstName!: string;

	@IsString()
	@IsNotEmpty()
	public personLastName!: string;

	@IsString()
	@IsNotEmpty()
	public personErwinRole!: ErwinRole;

	@IsString()
	@IsNotEmpty()
	public personEmail!: string;

	@IsDate()
	@IsNotEmpty()
	public personGeburtstag!: string;

	@IsString()
	@IsNotEmpty()
	public schuleExternalId!: string;

	@IsString()
	@IsNotEmpty()
	public schuleName!: string;

	@IsString()
	@IsNotEmpty()
	public schuleZugehoerigZu!: string;

	@IsArray()
	@IsNotEmpty()
	public klassen!: ErwinKlassePayload[];

	constructor(data: Partial<ErwinJwtPayload>) {
		Object.assign(this, data);
	}
}
