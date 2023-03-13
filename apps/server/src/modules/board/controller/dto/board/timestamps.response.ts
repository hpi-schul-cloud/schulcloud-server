/* interface BoardTimestamps {
	lastUpdatedAt: string;
	createdAt: string;
	deletedAt: string;
} */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimestampsResponse {
	constructor({ lastUpdatedAt, createdAt, deletedAt }: TimestampsResponse) {
		this.lastUpdatedAt = lastUpdatedAt;
		this.createdAt = createdAt;
		this.deletedAt = deletedAt;
	}

	@ApiProperty()
	lastUpdatedAt: Date;

	@ApiProperty()
	createdAt: Date;

	@ApiPropertyOptional()
	deletedAt?: Date;
}
