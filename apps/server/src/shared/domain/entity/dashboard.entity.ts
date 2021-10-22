import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityId } from '../types/entity-id';

const defaultColumns = 6;
const defaultRows = 6;

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

	getContent: () => GridElementContent;

	isGroup(): boolean;

	getReferences(): IGridElementReference[];

	addReferences(anotherReference: IGridElementReference[]): void;

	setGroupName(newGroupName: string): void;
}

export type GridElementContent = {
	referencedId?: string;
	title: string;
	shortTitle: string;
	displayColor: string;
	group?: GridElementReferenceMetadata[];
};

export class GridElement implements IGridElement {
	id: EntityId;

	title: string;

	private constructor(id: EntityId, references: IGridElementReference[]) {
		this.id = id;
		this.references = references;
	}

	static FromSingleReference(id: EntityId, reference: IGridElementReference): GridElement {
		return new GridElement(id, [reference]);
	}

	static FromReferenceGroup(id: EntityId, group: IGridElementReference[]): GridElement {
		return new GridElement(id, group);
	}

	references: IGridElementReference[];

	getId(): EntityId {
		return this.id;
	}

	getReferences(): IGridElementReference[] {
		return this.references;
	}

	addReferences(anotherReference: IGridElementReference[]): void {
		this.references = this.references.concat(anotherReference);
	}

	getContent(): GridElementContent {
		if (!this.isGroup()) {
			const { id: referencedId, ...data } = this.references[0].getMetadata();
			const metadata = {
				referencedId,
				...data,
			};
			return metadata;
		}
		const groupData = this.references.map((reference) => reference.getMetadata());
		const groupMetadata = {
			title: this.title,
			shortTitle: 'exampleShortTitle',
			displayColor: 'exampleColor',
			group: groupData,
		};
		return groupMetadata;
	}

	isGroup(): boolean {
		return this.references.length > 1;
	}

	setGroupName(newGroupName: string): void {
		this.title = newGroupName;
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

	columns: number;

	rows: number;

	grid: Map<number, IGridElement>;

	private gridIndexFromPosition(pos: GridPosition): number {
		if (pos.x > this.columns || pos.y > this.rows) {
			throw new BadRequestException('dashboard element position is outside the grid.');
		}
		return this.columns * pos.y + pos.x;
	}

	private positionFromGridIndex(index: number): GridPosition {
		const y = Math.floor(index / this.columns);
		const x = index % this.columns;
		return { x, y };
	}

	constructor(id: string, props: DashboardProps) {
		this.columns = props.colums || defaultColumns;
		this.rows = props.rows || defaultRows;
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

	moveElement(from: GridPosition, to: GridPosition): GridElementWithPosition {
		const elementToMove = this.grid.get(this.gridIndexFromPosition(from));
		if (!elementToMove) {
			throw new NotFoundException('no element at origin position');
		}

		const targetElement = this.grid.get(this.gridIndexFromPosition(to));
		if (targetElement) {
			targetElement.addReferences(elementToMove.getReferences());
		} else {
			this.grid.set(this.gridIndexFromPosition(to), elementToMove);
		}
		this.grid.delete(this.gridIndexFromPosition(from));

		const resultElement = this.grid.get(this.gridIndexFromPosition(to)) as IGridElement;
		return {
			pos: to,
			gridElement: resultElement,
		};
	}

	getElement(position: GridPosition): IGridElement {
		const element = this.grid.get(this.gridIndexFromPosition(position));
		if (!element) {
			throw new NotFoundException('no element at grid position');
		}
		return element;
	}
}
