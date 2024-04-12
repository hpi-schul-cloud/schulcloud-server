import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateMediaElementBodyParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the line where the element is created' })
	lineId!: string;

	@IsMongoId()
	@ApiProperty({ description: 'The position where the element is created' })
	position!: number;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the school external tool' })
	schoolExternalToolId!: string;
}
