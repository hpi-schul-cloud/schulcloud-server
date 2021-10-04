import { EntityId } from '../types/entity-id';

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
	id: EntityId;

	title: string;

	displayColor: string;

	constructor(id: EntityId, title: string, displayColor = '#f23f76') {
		this.id = id;
		this.title = title;
		this.displayColor = displayColor;
	}

	getMetadata(): GridElementReferenceMetadata {
		return {
			id: this.id,
			title: this.title,
			shortTitle: this.title.substr(0, 2),
			displayColor: this.displayColor,
		};
	}
}

export interface IGridElement {
	getId: () => EntityId;

	getPosition: () => { x: number; y: number };

	getMetadata: () => GridElementReferenceMetadata;
}

export class GridElement implements IGridElement {
	id: EntityId;

	constructor(id: EntityId, x: number, y: number, reference: IGridElementReference) {
		this.id = id;
		this.xPos = x;
		this.yPos = y;
		this.reference = reference;
	}

	reference: IGridElementReference;

	xPos: number;

	yPos: number;

	getId(): EntityId {
		return this.id;
	}

	// todo: consider removing position from gridElements, for cleaner update operations.
	getPosition(): GridPosition {
		return { x: this.xPos, y: this.yPos };
	}

	getMetadata(): GridElementReferenceMetadata {
		return this.reference.getMetadata();
	}
}

export type GridPosition = { x: number; y: number };

export type GridElementWithPosition = {
	gridElement: IGridElement;
	pos: GridPosition;
};

export type DashboardProps = { colums?: number; rows?: number; grid: IGridElement[] };

export class DashboardEntity {
	id: EntityId;

	colums: number;

	rows: number;

	grid: { [position: number]: IGridElement };

	private gridIndexFromPosition(pos: GridPosition): number {
		return this.colums * pos.y + pos.x;
	}

	constructor(id: string, props: DashboardProps) {
		this.colums = props.colums || 5;
		this.rows = props.rows || 5;
		this.grid = {};
		props.grid.forEach((element) => {
			this.grid[this.gridIndexFromPosition(element.getPosition())] = element;
		});
		this.id = id;
		Object.assign(this, {});
	}

	getId(): string {
		return this.id;
	}

	getGrid(): IGridElement[] {
		return Object.values(this.grid);
	}
}
