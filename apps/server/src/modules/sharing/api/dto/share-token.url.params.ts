import { ApiProperty } from '@nestjs/swagger';
import { PrivacyProtect } from '@shared/controller/validator';
import { IsString } from 'class-validator';

export class ShareTokenUrlParams {
	@PrivacyProtect()
	@IsString()
	@ApiProperty({
		description: 'The token that identifies the shared object',
		required: true,
		nullable: false,
	})
	token!: string;
}
