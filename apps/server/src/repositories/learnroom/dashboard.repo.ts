import { Injectable } from '@nestjs/common';
import { DashboardEntity } from '../../entities/learnroom/dashboard.entity';

@Injectable()
export class DashboardRepo {
	getUsersDashboard(): Promise<DashboardEntity> {
		return Promise.resolve(new DashboardEntity({ grid: [[]] }));
	}
}
