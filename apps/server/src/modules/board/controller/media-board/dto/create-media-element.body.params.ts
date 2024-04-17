import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateMediaElementBodyParams {
	@IsMongoId()
	@ApiProperty({ description: 'The id of the line where the element is created' })
	lineId!: string;

	@IsNumber()
	@Min(0)
	@ApiProperty({ description: 'The position where the element is created' })
	position!: number;

	@IsMongoId()
	@ApiProperty({ description: 'The id of the school external tool' })
	schoolExternalToolId!: string;
}
