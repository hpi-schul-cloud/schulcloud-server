import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EntityId, LearnroomMetadata } from '@shared/domain/types';
import { ILearnroom } from '@shared/domain/interface';

const defaultColumns = 4;

export interface IGridElement {
	hasId(): boolean;

	getId: () => EntityId | undefined;

	getContent: () => GridElementContent;

	isGroup(): boolean;

	removeReferenceByIndex(index: number): void;

	removeReference(reference: ILearnroom): void;

	getReferences(): ILearnroom[];

	addReferences(anotherReference: ILearnroom[]): void;

	setGroupName(newGroupName: string): void;
}

export type GridElementContent = {
	referencedId?: string;
	title?: string;
	shortTitle: string;
	displayColor: string;
	group?: LearnroomMetadata[];
	groupId?: string;
	copyingSince?: Date;
};

export class GridElement implements IGridElement {
	id?: EntityId;

	title?: string;

	private sortReferences = (a: ILearnroom, b: ILearnroom) => {
		const titleA = a.getMetadata().title;
		const titleB = b.getMetadata().title;
		if (titleA < titleB) {
			return -1;
		}
		if (titleA > titleB) {
			return 1;
		}
		return 0;
	};

	private constructor(props: { id?: EntityId; title?: string; references: ILearnroom[] }) {
		if (props.id) this.id = props.id;
		if (props.title) this.title = props.title;
		this.references = props.references.sort(this.sortReferences);
	}

	static FromPersistedReference(id: EntityId, reference: ILearnroom): GridElement {
		return new GridElement({ id, references: [reference] });
	}

	static FromPersistedGroup(id: EntityId, title: string | undefined, group: ILearnroom[]): GridElement {
		return new GridElement({ id, title, references: group });
	}

	static FromSingleReference(reference: ILearnroom): GridElement {
		return new GridElement({ references: [reference] });
	}

	static FromGroup(title: string, references: ILearnroom[]): GridElement {
		return new GridElement({ title, references });
	}

	references: ILearnroom[];

	hasId(): boolean {
		return !!this.id;
	}

	getId(): EntityId | undefined {
		return this.id;
	}

	getReferences(): ILearnroom[] {
		return this.references;
	}

	removeReferenceByIndex(index: number): void {
		if (!this.isGroup()) {
			throw new BadRequestException('this element is not a group.');
		}
		if (index > 0 && this.references.length <= index) {
			throw new BadRequestException('group index out of bounds.');
		}
		this.references.splice(index, 1);
	}

	removeReference(reference: ILearnroom): void {
		const index = this.references.indexOf(reference);
		if (index === -1) {
			throw new BadRequestException('reference not found.');
		}
		this.references.splice(index, 1);
	}

	addReferences(anotherReference: ILearnroom[]): void {
		if (!this.isGroup()) {
			this.references = this.references.concat(anotherReference).sort(this.sortReferences);
			this.setGroupName('');
		} else {
			this.references = this.references.concat(anotherReference).sort(this.sortReferences);
		}
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
		const checkShortTitle = this.title ? this.title.substring(0, 2) : '';
		const groupMetadata = {
			groupId: this.getId(),
			title: this.title,
			shortTitle: checkShortTitle,
			displayColor: 'exampleColor',
			group: groupData,
		};
		return groupMetadata;
	}

	isGroup(): boolean {
		return this.references.length > 1;
	}

	setGroupName(newGroupName: string): void {
		if (!this.isGroup()) {
			return;
		}
		this.title = newGroupName;
	}
}

export type GridPosition = { x: number; y: number };
export type GridPositionWithGroupIndex = { x: number; y: number; groupIndex?: number };

export type GridElementWithPosition = {
	gridElement: IGridElement;
	pos: GridPosition;
};

export type DashboardProps = { colums?: number; grid: GridElementWithPosition[]; userId: EntityId };

export class DashboardEntity {
	id: EntityId;

	columns: number;

	grid: Map<number, IGridElement>;

	userId: EntityId;

	private gridIndexFromPosition(pos: GridPosition): number {
		if (pos.x > this.columns) {
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
		this.grid = new Map<number, IGridElement>();
		props.grid.forEach((element) => {
			this.grid.set(this.gridIndexFromPosition(element.pos), element.gridElement);
		});
		this.id = id;
		this.userId = props.userId;
		Object.assign(this, {});
	}

	getId(): string {
		return this.id;
	}

	getUserId(): EntityId {
		return this.userId;
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
			throw new NotFoundException('no element at grid position');
		}
		return element;
	}

	moveElement(from: GridPositionWithGroupIndex, to: GridPositionWithGroupIndex): GridElementWithPosition {
		const elementToMove = this.getReferencesFromPosition(from);
		const resultElement = this.mergeElementIntoPosition(elementToMove, to);
		this.removeFromPosition(from);
		return {
			pos: to,
			gridElement: resultElement,
		};
	}

	setLearnRooms(rooms: ILearnroom[]): void {
		this.removeRoomsNotInList(rooms);
		const newRooms = this.determineNewRoomsIn(rooms);

		newRooms.forEach((room) => {
			this.addRoom(room);
		});
	}

	private removeRoomsNotInList(roomList: ILearnroom[]): void {
		[...this.grid.keys()].forEach((key) => {
			const element = this.grid.get(key) as IGridElement;
			const currentRooms = element.getReferences();
			currentRooms.forEach((room) => {
				if (!roomList.includes(room)) {
					element.removeReference(room);
				}
			});
			if (element.getReferences().length === 0) {
				this.grid.delete(key);
			}
		});
	}

	private determineNewRoomsIn(rooms: ILearnroom[]): ILearnroom[] {
		const result: ILearnroom[] = [];
		const existingRooms = this.allRooms();
		rooms.forEach((room) => {
			if (!existingRooms.includes(room)) {
				result.push(room);
			}
		});
		return result;
	}

	private allRooms(): ILearnroom[] {
		const elements = [...this.grid.values()];
		const references = elements.map((el) => el.getReferences()).flat();
		return references;
	}

	private addRoom(room: ILearnroom): void {
		const index = this.getFirstOpenIndex();
		const newElement = GridElement.FromSingleReference(room);
		this.grid.set(index, newElement);
	}

	private getFirstOpenIndex(): number {
		let i = 0;
		while (this.grid.get(i) !== undefined) {
			i += 1;
		}
		return i;
	}

	private getReferencesFromPosition(position: GridPositionWithGroupIndex): IGridElement {
		const elementToMove = this.getElement(position);

		if (typeof position.groupIndex === 'number' && elementToMove.isGroup()) {
			const references = elementToMove.getReferences();
			const referenceForIndex = references[position.groupIndex];
			return GridElement.FromSingleReference(referenceForIndex);
		}

		return elementToMove;
	}

	private removeFromPosition(position: GridPositionWithGroupIndex): void {
		const element = this.getElement(position);
		if (typeof position.groupIndex === 'number') {
			element.removeReferenceByIndex(position.groupIndex);
		} else {
			this.grid.delete(this.gridIndexFromPosition(position));
		}
	}

	private mergeElementIntoPosition(element: IGridElement, position: GridPosition): IGridElement {
		const targetElement = this.grid.get(this.gridIndexFromPosition(position));
		if (targetElement) {
			targetElement.addReferences(element.getReferences());
			return targetElement;
		}
		this.grid.set(this.gridIndexFromPosition(position), element);
		return element;
	}
}
