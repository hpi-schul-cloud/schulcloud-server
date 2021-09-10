import { Injectable } from '@nestjs/common';
import { DashboardEntity, DefaultGridReference, GridElement } from '../../entities/learnroom/dashboard.entity';

export interface IDashboardRepo {
	getUsersDashboard(): Promise<DashboardEntity>;
}

@Injectable()
export class DashboardRepo implements IDashboardRepo {
	getUsersDashboard(): Promise<DashboardEntity> {
		const gridArray: GridElement[] = [];
		const diagonalSize = 5;
		const elementReference = new DefaultGridReference('exampletitle');
		for (let i = 0; i < diagonalSize; i += 1) {
			gridArray.push(new GridElement(i, i, elementReference));
		}
		return Promise.resolve(new DashboardEntity({ grid: gridArray }));
	}
}
