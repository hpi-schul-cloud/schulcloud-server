import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PseudonymParams {
	@IsString()
	@ApiProperty({ nullable: false, required: true })
	pseudonym!: string;
}
