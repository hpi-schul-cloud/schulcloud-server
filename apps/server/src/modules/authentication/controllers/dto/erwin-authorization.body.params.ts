import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ErwinAuthorizationBodyParams {
	@IsMongoId()
	@ApiProperty()
	public systemId!: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty()
	public accessToken!: string;
}
