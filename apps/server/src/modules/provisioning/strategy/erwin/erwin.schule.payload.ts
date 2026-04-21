import { IsNotEmpty, IsString } from 'class-validator';

export class ErwinSchulePayload {
	@IsString()
	@IsNotEmpty()
	public externalId!: string;

	@IsString()
	@IsNotEmpty()
	public erwinId!: string;

	@IsString()
	@IsNotEmpty()
	public name!: string;

	@IsString()
	@IsNotEmpty()
	public zugehoerigZu!: string;
}
