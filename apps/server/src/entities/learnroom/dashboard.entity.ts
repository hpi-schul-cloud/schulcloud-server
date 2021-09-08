import { BaseEntityWithTimestamps } from '@shared/domain';

export class DefaultGridElement implements GridElement {
	getName = (): string => {
		return 'some default example name';
	};
}

export interface GridElement {
	getName: () => string;
}

export class DashboardEntity extends BaseEntityWithTimestamps {
	grid: GridElement[][];

	constructor(props: { grid: GridElement[][] }) {
		super();
		this.grid = props.grid || [];
		Object.assign(this, {});
	}

	getGrid(): GridElement[][] {
		return this.grid;
	}
}
