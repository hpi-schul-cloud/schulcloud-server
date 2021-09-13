import { BaseEntityWithTimestamps } from '@shared/domain';

export type GridElementReferenceMetadata = {
	id: string;
	title: string;
	shortTitle: string;
	displayColor: string;
};

export interface IGridElementReference {
	getMetadata: () => GridElementReferenceMetadata;
}

export class DefaultGridReference implements IGridElementReference {
	// This is only a temporary fake class, for use until other references, like courses, are fully supported.
	title: string;

	constructor(title: string) {
		this.title = title;
	}

	getMetadata(): GridElementReferenceMetadata {
		return {
			id: 'someId',
			title: this.title,
			shortTitle: this.title.substr(0, 2),
			displayColor: '#f23f76',
		};
	}
}

export interface IGridElement {
	getPosition(): { x: number; y: number };

	getMetadata: () => GridElementReferenceMetadata;
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

	getPosition(): { x: number; y: number } {
		return { x: this.xPos, y: this.yPos };
	}

	getMetadata(): GridElementReferenceMetadata {
		return this.reference.getMetadata();
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
