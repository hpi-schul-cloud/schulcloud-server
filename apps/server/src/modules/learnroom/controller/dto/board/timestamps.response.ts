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
	lastUpdatedAt: string;

	@ApiProperty()
	createdAt: string;

	@ApiPropertyOptional()
	deletedAt?: string;
}
