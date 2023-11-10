import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { DeletionLogStatistic, DeletionTargetRef } from '../../uc/interface';

export class DeletionRequestLogResponse {
	@ApiProperty()
	targetRef: DeletionTargetRef;

	@ApiProperty()
	deletionPlannedAt: Date;

	@ApiProperty()
	@IsOptional()
	statistics?: DeletionLogStatistic[];

	constructor(response: DeletionRequestLogResponse) {
		this.targetRef = response.targetRef;
		this.deletionPlannedAt = response.deletionPlannedAt;
		this.statistics = response.statistics;
	}
}
