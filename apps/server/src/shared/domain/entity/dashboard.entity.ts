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

	getMetadata: () => GridElementReferenceMetadata;
}

export class GridElement implements IGridElement {
	id: EntityId;

	constructor(id: EntityId, reference: IGridElementReference) {
		this.id = id;
		this.reference = reference;
	}

	reference: IGridElementReference;

	getId(): EntityId {
		return this.id;
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

export type DashboardProps = { colums?: number; rows?: number; grid: GridElementWithPosition[] };

export class DashboardEntity {
	id: EntityId;

	colums: number;

	rows: number;

	grid: Map<number, IGridElement>;

	private gridIndexFromPosition(pos: GridPosition): number {
		return this.colums * pos.y + pos.x;
	}

	private positionFromGridIndex(index: number): GridPosition {
		const y = Math.floor(index / this.colums);
		const x = index % this.colums;
		return { x, y };
	}

	constructor(id: string, props: DashboardProps) {
		this.colums = props.colums || 5;
		this.rows = props.rows || 5;
		this.grid = new Map<number, IGridElement>();
		props.grid.forEach((element) => {
			this.grid.set(this.gridIndexFromPosition(element.pos), element.gridElement);
		});
		this.id = id;
		Object.assign(this, {});
	}

	getId(): string {
		return this.id;
	}

	getGrid(): GridElementWithPosition[] {
		const result = [...this.grid.keys()].map((key) => {
			const position = this.positionFromGridIndex(key);
			const value = this.grid.get(key) as IGridElement;
			return {
				pos: position,
				gridElement: value,
			};
		});
		return result;
	}
}
