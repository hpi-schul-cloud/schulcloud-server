import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TargetUserIdParams {
	@ApiProperty()
	@IsMongoId()
	userId!: string;
}
