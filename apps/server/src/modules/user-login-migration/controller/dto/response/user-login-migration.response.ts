import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLoginMigrationResponse {
	@ApiProperty({ description: 'Id of the migration' })
	id: string;

	@ApiPropertyOptional({
		description: 'Id of the system which is the origin of the migration',
	})
	sourceSystemId?: string;

	@ApiProperty({
		description: 'Id of the system which is the target of the migration',
	})
	targetSystemId: string;

	@ApiPropertyOptional({
		description: 'Date when the migration was marked as required',
	})
	mandatorySince?: Date;

	@ApiProperty({
		description: 'Date when the migration was started',
	})
	startedAt: Date;

	@ApiPropertyOptional({
		description: 'Date when the migration was completed',
	})
	closedAt?: Date;

	@ApiPropertyOptional({
		description: 'Date when the migration was completed including the grace period',
	})
	finishedAt?: Date;

	constructor(props: UserLoginMigrationResponse) {
		this.id = props.id;
		this.sourceSystemId = props.sourceSystemId;
		this.targetSystemId = props.targetSystemId;
		this.mandatorySince = props.mandatorySince;
		this.startedAt = props.startedAt;
		this.closedAt = props.closedAt;
		this.finishedAt = props.finishedAt;
	}
}
