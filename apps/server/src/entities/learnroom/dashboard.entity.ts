import { BaseEntityWithTimestamps } from '@shared/domain';

export class DefaultGridElement implements GridElement {
	getAvatar = (): string => {
		return 'some default avatar defined in frontend maybe';
	};
}

export interface GridElement {
	getAvatar: () => string;
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
