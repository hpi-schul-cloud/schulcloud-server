import { Page } from '@shared/domain/domainobject';
import { DeletionBatchDetails, DeletionBatchSummary } from '../../domain/service';
import { DeletionBatchPaginationParams } from '../controller/dto/request/deletion-batch-pagination.params';
import { DeletionBatchItemResponse } from '../controller/dto/response/deletion-batch-item.response';
import { DeletionBatchListResponse } from '../controller/dto/response/deletion-batch-list.response';
import { UsersByRoleResponse } from '../controller/dto/response/users-by-role.response';
import { DeletionBatchDetailsResponse } from '../controller/dto/response/deletion-batch-details.response';

export class DeletionBatchMapper {
	public static mapToDeletionBatchItemResponse(summary: DeletionBatchSummary): DeletionBatchItemResponse {
		const response = new DeletionBatchItemResponse({
			id: summary.id,
			status: summary.status,
			name: summary.name,
			usersByRole: summary.usersByRole.map(
				(u) => new UsersByRoleResponse({ roleName: u.roleName, userCount: u.userCount })
			),
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
			status: details.status,
			pendingDeletions: details.pendingDeletions,
			failedDeletions: details.failedDeletions,
			successfulDeletions: details.successfulDeletions,
		});

		return response;
	}
}
