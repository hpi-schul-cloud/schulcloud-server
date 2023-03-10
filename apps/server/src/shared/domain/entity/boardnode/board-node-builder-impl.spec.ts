import { setupEntities } from '@shared/testing';
import { columnBoardFactory } from '@shared/testing/factory/domainobject';
import { BoardNodeBuilderImpl } from './board-node-builder-impl';
import { BoardNodeType } from './types';

describe(BoardNodeBuilderImpl.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when buildingCardElements', () => {});

	describe('when building TextElements', () => {
		const setup = () => {
			const textElement = columnBoardFactory;

			const builder = new BoardNodeBuilderImpl();

			return { builder, textElement };
		};

		it('should create a text element board node', () => {
			const { builder, textElement } = setup();

			const boardNodes = builder.buildTextElementNode(textElement);

			expect(boardNodes).toHaveLength(1);
			expect(boardNodes[0].id).toBe(textElement.id);
			expect(boardNodes[0].type).toBe(BoardNodeType.TEXT_ELEMENT);
		});
	});
});
