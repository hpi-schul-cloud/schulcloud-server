import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { DeletionTargetRef, DomainDeletionReport } from '../../../../domain/interface';
import { StatusModel } from '../../../../domain/types';

export class DeletionRequestLogResponse {
	@ApiProperty()
	public targetRef: DeletionTargetRef;

	@ApiProperty()
	public deletionPlannedAt: Date;

	@ApiProperty()
	public status: StatusModel;

	@ApiProperty()
	@IsOptional()
	public statistics?: DomainDeletionReport[];

	constructor(response: DeletionRequestLogResponse) {
		this.targetRef = response.targetRef;
		this.deletionPlannedAt = response.deletionPlannedAt;
		this.status = response.status;
		this.statistics = response.statistics;
	}
}
