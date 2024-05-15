import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ColumnBoard } from '@modules/board';
import { LegacyBoardElement, LegacyBoardElementType } from './legacy-boardelement.entity';

@Entity({ discriminatorValue: LegacyBoardElementType.ColumnBoard })
export class ColumnboardBoardElement extends LegacyBoardElement {
	constructor(props: { target: ColumnBoard }) {
		super();
		this.boardElementType = LegacyBoardElementType.ColumnBoard;
		this.columnBoard = props.target;
	}

	@Property({ fieldName: 'target' })
	_target!: ObjectId;

	get target() {
		return this.columnBoard;
	}

	@Property({ persist: false })
	_columnBoard!: ColumnBoard;

	get columnBoard() {
		return this._columnBoard;
	}

	set columnBoard(columnBoard: ColumnBoard) {
		this._columnBoard = columnBoard;
		this._target = new ObjectId(columnBoard.id);
	}
}
