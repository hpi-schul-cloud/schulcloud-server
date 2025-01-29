import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { DeletionRequestBodyProps } from './deletion-request.body.props';

export class DeletionBatchBodyProps {
	@ApiProperty({
		description: 'Array of deletion requests to process in batch',
		required: true,
		type: () => [DeletionRequestBodyProps],
	})
	@IsArray()
	@IsNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => DeletionRequestBodyProps)
	deletionRequests: DeletionRequestBodyProps[] = [];

	constructor() {
		this.deletionRequests = [];
	}
}