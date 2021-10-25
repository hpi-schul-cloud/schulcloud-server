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
	hasId(): boolean;

	getId: () => EntityId;

	getContent: () => GridElementContent;

	isGroup(): boolean;

	removeReference(index: number): void;

	getReferences(): IGridElementReference[];

	addReferences(anotherReference: IGridElementReference[]): void;
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

	private constructor(props: { id?: EntityId; references: IGridElementReference[] }) {
		if (props.id) this.id = props.id;
		this.references = props.references;
	}

	static FromPersistedReference(id: EntityId, reference: IGridElementReference): GridElement {
		return new GridElement({ id, references: [reference] });
	}

	static FromPersistedGroup(id: EntityId, group: IGridElementReference[]): GridElement {
		return new GridElement({ id, references: group });
	}

	static FromSingleReference(reference: IGridElementReference): GridElement {
		return new GridElement({ references: [reference] });
	}

	static FromReferences(references: IGridElementReference[]): GridElement {
		return new GridElement({ references });
	}

	references: IGridElementReference[];

	hasId(): boolean {
		return !!this.id;
	}

	getId(): EntityId {
		return this.id;
	}

	getReferences(): IGridElementReference[] {
		return this.references;
	}

	removeReference(index: number): void {
		if (!this.isGroup()) {
			throw new BadRequestException('this element is not a group.');
		}
		if (index > 0 && this.references.length <= index) {
			throw new BadRequestException('group index out of bounds.');
		}
		this.references.splice(index, 1);
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
			title: 'exampleTitle',
			shortTitle: 'exampleShortTitle',
			displayColor: 'exampleColor',
			group: groupData,
		};
		return groupMetadata;
	}

	isGroup(): boolean {
		return this.references.length > 1;
	}
}

export type GridPosition = { x: number; y: number };
export type GridPositionWithGroupIndex = { x: number; y: number; groupIndex?: number };

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

	getElement(position: GridPosition): IGridElement {
		const element = this.grid.get(this.gridIndexFromPosition(position));
		if (!element) {
			throw new NotFoundException('no element at origin position');
		}
		return element;
	}

	moveElement(from: GridPositionWithGroupIndex, to: GridPositionWithGroupIndex): GridElementWithPosition {
		const referencesToMove = this.getReferencesFromPosition(from);
		const resultElement = this.addReferencesToPosition(referencesToMove, to);
		this.removeFromPosition(from);
		return {
			pos: to,
			gridElement: resultElement,
		};
	}

	private getReferencesFromPosition(position: GridPositionWithGroupIndex): IGridElementReference[] {
		const elementToMove = this.getElement(position);
		let references = elementToMove.getReferences();

		if (typeof position.groupIndex === 'number') {
			const referenceForIndex = references[position.groupIndex];
			references = [referenceForIndex];
		}
		return references;
	}

	private removeFromPosition(position: GridPositionWithGroupIndex): void {
		const element = this.getElement(position);
		if (typeof position.groupIndex === 'number') {
			element.removeReference(position.groupIndex);
		} else {
			this.grid.delete(this.gridIndexFromPosition(position));
		}
	}

	private addReferencesToPosition(references: IGridElementReference[], position: GridPosition): IGridElement {
		let targetElement = this.grid.get(this.gridIndexFromPosition(position));
		if (targetElement) {
			targetElement.addReferences(references);
		} else {
			targetElement = GridElement.FromReferences(references);
			this.grid.set(this.gridIndexFromPosition(position), targetElement);
		}
		return targetElement;
	}
}
