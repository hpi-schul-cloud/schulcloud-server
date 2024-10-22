export class TimestampResponseDto {
	lastUpdatedAt: string;

	createdAt: string;

	deletedAt: string | undefined;

	constructor(lastUpdatedAt: string, createdAt: string, deletedAt: string) {
		this.lastUpdatedAt = lastUpdatedAt;
		this.createdAt = createdAt;
		this.deletedAt = deletedAt;
	}
}
