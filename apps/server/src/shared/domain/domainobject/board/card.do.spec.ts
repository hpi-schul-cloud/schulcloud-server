import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { cardFactory, columnBoardFactory, columnFactory, textElementFactory } from '@shared/testing';
import { Card } from './card.do';
import { BoardNodeBuilder } from './types';

describe(Card.name, () => {
	describe('useBoardNodeBuilder', () => {
		const setup = () => {
			const card = cardFactory.build();
			const element = textElementFactory.build();
			const column = columnFactory.build();
			const builder: DeepMocked<BoardNodeBuilder> = createMock<BoardNodeBuilder>();

			return { card, element, builder, column };
		};

		it('should call the specific builder method', () => {
			const { card, builder, column } = setup();

			card.useBoardNodeBuilder(builder, column);

			expect(builder.buildCardNode).toHaveBeenCalledWith(card, column);
		});
	});

	describe('addChild', () => {
		const setup = () => {
			const children = textElementFactory.buildListWithId(3);
			const card = cardFactory.build({ children });
			const element = textElementFactory.build();

			return { card, element };
		};

		it('should throw error on unsupported child type', () => {
			const { card } = setup();
			const board = columnBoardFactory.build();
			expect(() => card.addChild(board)).toThrowError();
		});

		it('should be able to add children', () => {
			const { card, element } = setup();

			card.addChild(element);

			expect(card.children[card.children.length - 1]).toEqual(element);
		});

		it('should add child to correct position', () => {
			const { card, element } = setup();

			card.addChild(element, 1);

			expect(card.children[1]).toEqual(element);
		});
	});
});
