import { EntityId } from '@shared/domain';

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

	getPosition(): { x: number; y: number } {
		return { x: this.xPos, y: this.yPos };
	}

	getMetadata(): GridElementReferenceMetadata {
		return this.reference.getMetadata();
	}
}

export type DashboardProps = { grid: IGridElement[] };

export class DashboardEntity {
	id: EntityId;

	grid: IGridElement[];

	constructor(id: string, props: DashboardProps) {
		this.grid = props.grid || [];
		this.id = id;
		Object.assign(this, {});
	}

	getId(): string {
		return this.id;
	}

	getGrid(): IGridElement[] {
		return this.grid;
	}
}
