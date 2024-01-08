import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { DomainOperation } from '@shared/domain/interface';
import { DeletionTargetRef } from '../../interface';

export class DeletionRequestLogResponse {
	@ApiProperty()
	targetRef: DeletionTargetRef;

	@ApiProperty()
	deletionPlannedAt: Date;

	@ApiProperty()
	@IsOptional()
	statistics?: DomainOperation[];

	constructor(response: DeletionRequestLogResponse) {
		this.targetRef = response.targetRef;
		this.deletionPlannedAt = response.deletionPlannedAt;
		this.statistics = response.statistics;
	}
}
