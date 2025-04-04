import { ApiProperty } from '@nestjs/swagger';

export class FilesStorageStatsResponse {
	@ApiProperty()
	totalSize!: number;

	@ApiProperty()
	totalCount!: number;

	constructor(totalSize: number, totalCount: number) {
		this.totalSize = totalSize;
		this.totalCount = totalCount;
	}
}
