import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { IDashboardRepo } from '@shared/repo';

@Injectable()
export class DashboardService {
	constructor(@Inject('DASHBOARD_REPO') private readonly dashboardRepo: IDashboardRepo) {}

	async deleteDashboardByUserId(userId: EntityId): Promise<number> {
		const promise = await this.dashboardRepo.deleteDashboardByUserId(userId);

		return promise;
	}
}
