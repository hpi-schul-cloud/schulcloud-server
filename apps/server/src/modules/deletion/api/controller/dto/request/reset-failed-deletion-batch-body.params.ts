import { ApiProperty } from '@nestjs/swagger';
import { EntityId } from '@shared/domain/types';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class ResetFailedDeletionBatchBodyParams {
	@ApiProperty({
		description: 'List of targetRefIds to reset from failed to registered in a batch',
		required: true,
		type: [String],
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsMongoId({ each: true })
	public targetRefIds: EntityId[] = [];
}
