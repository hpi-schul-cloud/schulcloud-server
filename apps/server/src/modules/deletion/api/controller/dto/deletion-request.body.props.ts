import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { DeletionTargetRef } from '../../../domain/interface';

const MINUTES_OF_30_DAYS = 30 * 24 * 60;
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
	deleteInMinutes?: number = MINUTES_OF_30_DAYS;
}
