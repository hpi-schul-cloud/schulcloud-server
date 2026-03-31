import { Page } from '@shared/domain/domainobject';
import { DeletionBatchDetails, DeletionBatchSummary } from '../../domain/service';
import { DeletionBatchPaginationParams } from '../controller/dto/request/deletion-batch-pagination.params';
import { DeletionBatchDetailsResponse } from '../controller/dto/response/deletion-batch-details.response';
import { DeletionBatchItemResponse } from '../controller/dto/response/deletion-batch-item.response';
import { DeletionBatchListResponse } from '../controller/dto/response/deletion-batch-list.response';

export class DeletionBatchMapper {
	public static mapToDeletionBatchItemResponse(summary: DeletionBatchSummary): DeletionBatchItemResponse {
		const response = new DeletionBatchItemResponse({
			id: summary.id,
			name: summary.name,
			status: summary.status,
			validUsers: summary.validUsers,
			invalidUsers: summary.invalidUsers,
			skippedUsers: summary.skippedUsers,
			createdAt: summary.createdAt,
			updatedAt: summary.updatedAt,
		});

		return response;
	}

	public static mapToDeletionBatchListResponse(
		summaries: Page<DeletionBatchSummary>,
		pagination: DeletionBatchPaginationParams
	): DeletionBatchListResponse {
		const data: DeletionBatchItemResponse[] = summaries.data.map(
			(summary): DeletionBatchItemResponse => this.mapToDeletionBatchItemResponse(summary)
		);
		const response = new DeletionBatchListResponse(data, summaries.total, pagination.skip, pagination.limit);

		return response;
	}

	public static mapToDeletionBatchDetailsResponse(details: DeletionBatchDetails): DeletionBatchDetailsResponse {
		const response = new DeletionBatchDetailsResponse({
			id: details.id,
			name: details.name,
			status: details.status,
			validUsers: details.validUsers,
			invalidUsers: details.invalidUsers,
			skippedUsers: details.skippedUsers,
			pendingDeletions: details.pendingDeletions,
			failedDeletions: details.failedDeletions,
			successfulDeletions: details.successfulDeletions,
			createdAt: details.createdAt,
			updatedAt: details.updatedAt,
		});

		return response;
	}
}
