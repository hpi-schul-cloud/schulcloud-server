import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller/dto';
import { DeletionBatchItemResponse } from './deletion-batch-item.response';

export class DeletionBatchListResponse extends PaginationResponse<DeletionBatchItemResponse[]> {
	constructor(data: DeletionBatchItemResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [DeletionBatchItemResponse] })
	data: DeletionBatchItemResponse[];
}
