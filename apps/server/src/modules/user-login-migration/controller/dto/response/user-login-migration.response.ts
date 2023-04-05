import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLoginMigrationResponse {
	@ApiProperty({
		description: 'Id of the system which is the origin of the migration',
	})
	sourceSystemId: string;

	@ApiProperty({
		description: 'Id of the system which is the target of the migration',
	})
	targetSystemId: string;

	@ApiPropertyOptional()
	@ApiProperty({
		description: 'Date when the migration was marked as required',
	})
	mandatorySince?: Date;

	@ApiProperty({
		description: 'Date when the migration was started',
	})
	startedAt: Date;

	@ApiPropertyOptional()
	@ApiProperty({
		description: 'Date when the migration was completed',
	})
	completedAt?: Date;

	@ApiPropertyOptional()
	@ApiProperty({
		description: 'Date when the migration was completed including the grace period',
	})
	finishedAt?: Date;

	constructor(props: UserLoginMigrationResponse) {
		this.sourceSystemId = props.sourceSystemId;
		this.targetSystemId = props.targetSystemId;
		this.mandatorySince = props.mandatorySince;
		this.startedAt = props.startedAt;
		this.completedAt = props.completedAt;
		this.finishedAt = props.finishedAt;
	}
}
