import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { DeletionTargetRef } from '../../uc/interface';

export class DeletionRequestBodyProps {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	targetRef!: DeletionTargetRef;

	@IsNumber()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	deleteInMinutes?: number;
}
