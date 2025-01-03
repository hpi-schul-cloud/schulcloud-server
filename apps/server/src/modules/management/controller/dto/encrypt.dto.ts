import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EncryptDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	public plainText!: string;
}
