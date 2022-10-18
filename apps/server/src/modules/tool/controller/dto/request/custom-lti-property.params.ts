import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

// TODO: tests
export class CustomLtiPropertyParameter {
	@IsString()
	@ApiProperty()
	key!: string;

	@IsString()
	@ApiProperty()
	value!: string;
}
