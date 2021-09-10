import { BaseEntityWithTimestamps } from '@shared/domain';

export interface IGridElementReference {
	getName: () => string;
}

export class DefaultGridReference implements IGridElementReference {
	// This is only a temporary fake class, for use until other references, like courses, are fully supported.
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	getName = (): string => {
		return this.name;
	};
}

export interface IGridElement {
	xPos: number;

	yPos: number;

	getName: () => string;
}

export class GridElement implements IGridElement {
	constructor(x: number, y: number, reference: IGridElementReference) {
		this.xPos = x;
		this.yPos = y;
		this.reference = reference;
	}

	reference: IGridElementReference;

	xPos: number;

	yPos: number;

	getName(): string {
		return this.reference.getName();
	}
}

export class DashboardEntity extends BaseEntityWithTimestamps {
	grid: IGridElement[];

	constructor(props: { grid: IGridElement[] }) {
		super();
		this.grid = props.grid || [];
		Object.assign(this, {});
	}

	getGrid(): IGridElement[] {
		return this.grid;
	}
}
