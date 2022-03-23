import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class UpdateMatchParams {
	@ApiProperty({ description: 'updates local user reference for an import user' })
	@IsMongoId()
	userId!: string;
}
