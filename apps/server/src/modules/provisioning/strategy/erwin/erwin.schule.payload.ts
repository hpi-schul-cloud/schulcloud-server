import { IsString, IsNotEmpty } from 'class-validator';

export class ErwinSchulePayload {
	@IsString()
	@IsNotEmpty()
	public externalId!: string;

	@IsString()
	@IsNotEmpty()
	public name!: string;

	@IsString()
	@IsNotEmpty()
	public zugehoerigZu!: string;

	constructor(payload: Partial<ErwinSchulePayload>) {
		Object.assign(this, payload);
	}
}
