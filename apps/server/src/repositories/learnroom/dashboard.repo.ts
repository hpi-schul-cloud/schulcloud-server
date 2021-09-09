import { Injectable } from '@nestjs/common';
import {
	DashboardEntity,
	DefaultGridElement,
	GridElement,
	DashboardGrid,
} from '../../entities/learnroom/dashboard.entity';

@Injectable()
export class DashboardRepo {
	getUsersDashboard(): Promise<DashboardEntity> {
		const diagonalGrid: DashboardGrid = [];
		const diagonalSize = 5;
		for (let i = 0; i < diagonalSize; i += 1) {
			const row: (GridElement | null)[] = [];
			for (let j = 0; j < i; j += 1) {
				row.push(null);
			}
			row.push(new DefaultGridElement());
			diagonalGrid.push(row);
		}
		return Promise.resolve(new DashboardEntity({ grid: diagonalGrid }));
	}
}
