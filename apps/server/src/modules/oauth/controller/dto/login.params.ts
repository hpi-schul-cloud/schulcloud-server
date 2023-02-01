import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class LoginParams {
	@IsMongoId()
	@ApiProperty({
		description: 'The id of the system.',
		required: true,
		nullable: false,
	})
	systemId!: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	postLoginRedirect?: string;
}
