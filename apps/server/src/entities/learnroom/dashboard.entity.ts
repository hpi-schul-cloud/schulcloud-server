import { BaseEntityWithTimestamps } from '@shared/domain';

export class DefaultGridElement implements GridElement {
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	getName = (): string => {
		return this.name;
	};
}

export type DashboardGrid = (GridElement | null)[][];

export interface GridElement {
	getName: () => string;
}

export class DashboardEntity extends BaseEntityWithTimestamps {
	grid: DashboardGrid;

	constructor(props: { grid: DashboardGrid }) {
		super();
		this.grid = props.grid || [];
		Object.assign(this, {});
	}

	getGrid(): DashboardGrid {
		return this.grid;
	}
}
