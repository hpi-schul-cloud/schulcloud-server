import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';

export class DeletionRequestBodyProps {
	@ApiProperty({
		required: true,
		nullable: false,
	})
	targetRef!: { targetRefDomain: DeletionDomainModel; targetRefId: EntityId };

	@IsNumber()
	@ApiProperty({
		required: true,
		nullable: false,
	})
	deleteInMinutes?: number;
}
