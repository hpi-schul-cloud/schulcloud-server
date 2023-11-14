import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { DeletionTargetRef } from '../../uc/interface';

export class DeletionRequestBodyProps {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	targetRef!: DeletionTargetRef;

	@IsNumber()
	@Min(0)
	@IsOptional()
	@ApiPropertyOptional({
		required: true,
		nullable: false,
	})
	deleteInMinutes?: number = 43200;
}
