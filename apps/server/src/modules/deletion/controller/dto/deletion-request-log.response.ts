import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { DeletionTargetRef, DomainDeletionReport } from '../../interface';
import { StatusModel } from '../../types';

export class DeletionRequestLogResponse {
	@ApiProperty()
	targetRef: DeletionTargetRef;

	@ApiProperty()
	deletionPlannedAt: Date;

	@ApiProperty()
	status: StatusModel;

	@ApiProperty()
	@IsOptional()
	statistics?: DomainDeletionReport[];

	constructor(response: DeletionRequestLogResponse) {
		this.targetRef = response.targetRef;
		this.deletionPlannedAt = response.deletionPlannedAt;
		this.status = response.status;
		this.statistics = response.statistics;
	}
}
