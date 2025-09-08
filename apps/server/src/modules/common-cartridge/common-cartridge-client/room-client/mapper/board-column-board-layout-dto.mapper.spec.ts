import { BoardColumnBoardLayoutMapper } from './board-column-board-layout-dto.mapper';
import { BoardLayout } from '../enums/board-layout.enum';

describe(BoardColumnBoardLayoutMapper.name, () => {
	describe('mapColumnBoardLayoutToDto', () => {
		it('should map column layout to BoardLayout DTO', () => {
			const layout = 'columns';
			const result = BoardColumnBoardLayoutMapper.mapColumnBoardLayoutToDto(layout);

			expect(result).toEqual(BoardLayout.COLUMNS);
		});

		it('should map list layout to BoardLayout DTO', () => {
			const layout = 'list';
			const result = BoardColumnBoardLayoutMapper.mapColumnBoardLayoutToDto(layout);

			expect(result).toEqual(BoardLayout.LIST);
		});

		it('should map grid layout to BoardLayout DTO', () => {
			const layout = 'grid';
			const result = BoardColumnBoardLayoutMapper.mapColumnBoardLayoutToDto(layout);

			expect(result).toEqual(BoardLayout.GRID);
		});

		it('should map unknown layout to BoardLayout DTO', () => {
			const layout = 'unknown';
			const result = BoardColumnBoardLayoutMapper.mapColumnBoardLayoutToDto(layout);

			expect(result).toEqual(BoardLayout.COLUMNS);
		});
	});
});
