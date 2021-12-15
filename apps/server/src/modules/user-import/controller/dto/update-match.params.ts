import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class UpdateMatchParams {
	@IsMongoId()
	@ApiProperty({ description: 'updates local user reference for an import user' })
	userId!: string;
}
