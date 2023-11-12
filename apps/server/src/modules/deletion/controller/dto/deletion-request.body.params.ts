import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { DeletionTargetRef } from '../../uc/interface';

export class DeletionRequestBodyProps {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	targetRef!: DeletionTargetRef;

	@IsNumber()
	@ApiPropertyOptional({
		required: true,
		nullable: false,
	})
	deleteInMinutes?: number = 43200;
}
