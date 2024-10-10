import { BoardLayout } from '../enums/board-layout.enum';

export class BoardColumnBoardLayoutMapper {
	public static mapColumnBoardLayoutToDto(layout: string): BoardLayout {
		switch (layout) {
			case 'columns':
				return BoardLayout.COLUMNS;
			case 'list':
				return BoardLayout.LIST;
			case 'grid':
				return BoardLayout.GRID;
			default:
				return BoardLayout.COLUMNS;
		}
	}
}
