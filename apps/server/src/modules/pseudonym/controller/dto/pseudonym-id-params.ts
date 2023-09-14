import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PseudonymIdParams {
	@IsMongoId()
	@ApiProperty({ nullable: false, required: true })
	pseudonymId!: string;
}
