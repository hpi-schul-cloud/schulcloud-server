import {
	ExternalToolElement,
	LinkElement,
	MediaBoard,
	MediaExternalToolElement,
	MediaLine,
} from '@shared/domain/domainobject';
import { BoardNodeType } from '@shared/domain/entity';
import {
	cardNodeFactory,
	columnBoardNodeFactory,
	columnNodeFactory,
	externalToolElementNodeFactory,
	fileElementNodeFactory,
	linkElementNodeFactory,
	mediaBoardNodeFactory,
	mediaExternalToolElementNodeFactory,
	mediaLineNodeFactory,
	richTextElementNodeFactory,
	setupEntities,
	submissionContainerElementNodeFactory,
} from '@shared/testing';
import { drawingElementNodeFactory } from '@shared/testing/factory/boardnode/drawing-element-node.factory';
import { BoardDoBuilderImpl } from './board-do.builder-impl';

describe(BoardDoBuilderImpl.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('when building a column board', () => {
		it('should work without descendants', () => {
			const columnBoardNode = columnBoardNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildColumnBoard(columnBoardNode);

			expect(domainObject.constructor.name).toBe('ColumnBoard');
		});

		it('should throw error with wrong type of children', () => {
			const columnBoardNode1 = columnBoardNodeFactory.buildWithId();
			const columnBoardNode2 = columnBoardNodeFactory.buildWithId({ parent: columnBoardNode1 });

			expect(() => {
				new BoardDoBuilderImpl([columnBoardNode2]).buildColumnBoard(columnBoardNode1);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			const columnNode1 = columnNodeFactory.buildWithId({ parent: columnBoardNode });
			const columnNode2 = columnNodeFactory.buildWithId({ parent: columnBoardNode });

			const domainObject = new BoardDoBuilderImpl([columnNode1, columnNode2]).buildColumnBoard(columnBoardNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([columnNode1.id, columnNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			const columnNode1 = columnNodeFactory.buildWithId({ parent: columnBoardNode, position: 3 });
			const columnNode2 = columnNodeFactory.buildWithId({ parent: columnBoardNode, position: 2 });
			const columnNode3 = columnNodeFactory.buildWithId({ parent: columnBoardNode, position: 1 });

			const domainObject = new BoardDoBuilderImpl([columnNode1, columnNode2, columnNode3]).buildColumnBoard(
				columnBoardNode
			);

			const elementIds = domainObject.children.map((el) => el.id);
			expect(elementIds).toEqual([columnNode3.id, columnNode2.id, columnNode1.id]);
		});

		it('should be able to use the builder', () => {
			const columnBoardNode = columnBoardNodeFactory.buildWithId();
			const builder = new BoardDoBuilderImpl();
			const domainObject = columnBoardNode.useDoBuilder(builder);
			expect(domainObject.id).toEqual(columnBoardNode.id);
		});
	});

	describe('when building a column', () => {
		it('should work without descendants', () => {
			const columnNode = columnNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildColumn(columnNode);

			expect(domainObject.constructor.name).toBe('Column');
		});

		it('should throw error with wrong type of children', () => {
			const columnNode1 = columnNodeFactory.buildWithId();
			const columnNode2 = columnNodeFactory.buildWithId({ parent: columnNode1 });

			expect(() => {
				new BoardDoBuilderImpl([columnNode2]).buildColumn(columnNode1);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const columnNode = columnNodeFactory.buildWithId();
			const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode });
			const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode });

			const domainObject = new BoardDoBuilderImpl([cardNode1, cardNode2]).buildColumn(columnNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([cardNode1.id, cardNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const columnNode = columnNodeFactory.buildWithId();
			const cardNode1 = cardNodeFactory.buildWithId({ parent: columnNode, position: 3 });
			const cardNode2 = cardNodeFactory.buildWithId({ parent: columnNode, position: 2 });
			const cardNode3 = cardNodeFactory.buildWithId({ parent: columnNode, position: 1 });

			const domainObject = new BoardDoBuilderImpl([cardNode1, cardNode2, cardNode3]).buildColumn(columnNode);

			const cardIds = domainObject.children.map((el) => el.id);
			expect(cardIds).toEqual([cardNode3.id, cardNode2.id, cardNode1.id]);
		});
	});

	describe('when building a card', () => {
		it('should work without descendants', () => {
			const cardNode = cardNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildCard(cardNode);

			expect(domainObject.constructor.name).toBe('Card');
		});

		it('should throw error with wrong type of children', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: cardNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildCard(cardNode);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const elementNode1 = richTextElementNodeFactory.buildWithId({ parent: cardNode });
			const elementNode2 = richTextElementNodeFactory.buildWithId({ parent: cardNode });

			const domainObject = new BoardDoBuilderImpl([elementNode1, elementNode2]).buildCard(cardNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([elementNode1.id, elementNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const cardNode = cardNodeFactory.buildWithId();
			const elementNode1 = richTextElementNodeFactory.buildWithId({ parent: cardNode, position: 2 });
			const elementNode2 = richTextElementNodeFactory.buildWithId({ parent: cardNode, position: 3 });
			const elementNode3 = richTextElementNodeFactory.buildWithId({ parent: cardNode, position: 1 });

			const domainObject = new BoardDoBuilderImpl([elementNode1, elementNode2, elementNode3]).buildCard(cardNode);

			const elementIds = domainObject.children.map((el) => el.id);
			expect(elementIds).toEqual([elementNode3.id, elementNode1.id, elementNode2.id]);
		});
	});

	describe('when building a rich text element', () => {
		it('should work without descendants', () => {
			const richTextElementNode = richTextElementNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildRichTextElement(richTextElementNode);

			expect(domainObject.constructor.name).toBe('RichTextElement');
		});

		it('should throw error if richTextElement is not a leaf', () => {
			const richTextElementNode = richTextElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: richTextElementNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildRichTextElement(richTextElementNode);
			}).toThrowError();
		});
	});

	describe('when building a drawing element', () => {
		it('should work without descendants', () => {
			const drawingElementNode = drawingElementNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildDrawingElement(drawingElementNode);

			expect(domainObject.constructor.name).toBe('DrawingElement');
		});

		it('should throw error if drawingElement is not a leaf', () => {
			const drawingElementNode = drawingElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: drawingElementNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildDrawingElement(drawingElementNode);
			}).toThrowError();
		});
	});

	describe('when building a submission container element', () => {
		it('should work without descendants', () => {
			const submissionContainerElementNode = submissionContainerElementNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildSubmissionContainerElement(submissionContainerElementNode);

			expect(domainObject.constructor.name).toBe('SubmissionContainerElement');
		});

		it('should throw error if submissionContainerElement is not a leaf', () => {
			const submissionContainerElementNode = submissionContainerElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: submissionContainerElementNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildSubmissionContainerElement(submissionContainerElementNode);
			}).toThrowError();
		});
	});

	describe('when building a external tool element', () => {
		it('should work without descendants', () => {
			const externalToolElementNode = externalToolElementNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildExternalToolElement(externalToolElementNode);

			expect(domainObject.constructor.name).toBe(ExternalToolElement.name);
		});

		it('should throw error if externalToolElement is not a leaf', () => {
			const externalToolElementNode = externalToolElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: externalToolElementNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildExternalToolElement(externalToolElementNode);
			}).toThrowError();
		});
	});

	describe('when building a link element', () => {
		it('should work without descendants', () => {
			const linkElementNode = linkElementNodeFactory.buildWithId();

			const domainObject = new BoardDoBuilderImpl().buildLinkElement(linkElementNode);

			expect(domainObject.constructor.name).toBe(LinkElement.name);
		});

		it('should throw error if linkElement is not a leaf', () => {
			const linkElementNode = linkElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: linkElementNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildLinkElement(linkElementNode);
			}).toThrowError();
		});
	});

	describe('when building a media board', () => {
		it('should work without descendants', () => {
			const mediaBoardNode = mediaBoardNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildMediaBoard(mediaBoardNode);

			expect(domainObject.constructor.name).toBe(MediaBoard.name);
		});

		it('should throw error with wrong type of children', () => {
			const mediaBoardNode1 = mediaBoardNodeFactory.buildWithId();
			const mediaBoardNode2 = mediaBoardNodeFactory.buildWithId({ parent: mediaBoardNode1 });

			expect(() => {
				new BoardDoBuilderImpl([mediaBoardNode2]).buildMediaBoard(mediaBoardNode1);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const mediaBoardNode = mediaBoardNodeFactory.buildWithId();
			const lineNode1 = mediaLineNodeFactory.buildWithId({ parent: mediaBoardNode });
			const lineNode2 = mediaLineNodeFactory.buildWithId({ parent: mediaBoardNode });

			const domainObject = new BoardDoBuilderImpl([lineNode1, lineNode2]).buildMediaBoard(mediaBoardNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([lineNode1.id, lineNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const mediaBoardNode = mediaBoardNodeFactory.buildWithId();
			const lineNode1 = mediaLineNodeFactory.buildWithId({ parent: mediaBoardNode, position: 3 });
			const lineNode2 = mediaLineNodeFactory.buildWithId({ parent: mediaBoardNode, position: 2 });
			const lineNode3 = mediaLineNodeFactory.buildWithId({ parent: mediaBoardNode, position: 1 });

			const domainObject = new BoardDoBuilderImpl([lineNode1, lineNode2, lineNode3]).buildMediaBoard(mediaBoardNode);

			const elementIds = domainObject.children.map((el) => el.id);
			expect(elementIds).toEqual([lineNode3.id, lineNode2.id, lineNode1.id]);
		});

		it('should be able to use the builder', () => {
			const mediaBoardNode = mediaBoardNodeFactory.buildWithId();
			const builder = new BoardDoBuilderImpl();
			const domainObject = mediaBoardNode.useDoBuilder(builder);
			expect(domainObject.id).toEqual(mediaBoardNode.id);
		});
	});

	describe('when building a media line', () => {
		it('should work without descendants', () => {
			const columnNode = mediaLineNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildMediaLine(columnNode);

			expect(domainObject.constructor.name).toBe(MediaLine.name);
		});

		it('should throw error with wrong type of children', () => {
			const lineNode1 = mediaLineNodeFactory.buildWithId();
			const lineNode2 = mediaLineNodeFactory.buildWithId({ parent: lineNode1 });

			expect(() => {
				new BoardDoBuilderImpl([lineNode2]).buildMediaLine(lineNode1);
			}).toThrowError();
		});

		it('should assign the children', () => {
			const lineNode = mediaLineNodeFactory.buildWithId();
			const elementNode1 = mediaExternalToolElementNodeFactory.buildWithId({ parent: lineNode });
			const elementNode2 = mediaExternalToolElementNodeFactory.buildWithId({ parent: lineNode });

			const domainObject = new BoardDoBuilderImpl([elementNode1, elementNode2]).buildMediaLine(lineNode);

			expect(domainObject.children.map((el) => el.id).sort()).toEqual([elementNode1.id, elementNode2.id]);
		});

		it('should sort the children by their node position', () => {
			const lineNode = mediaLineNodeFactory.buildWithId();
			const elementNode1 = mediaExternalToolElementNodeFactory.buildWithId({ parent: lineNode, position: 3 });
			const elementNode2 = mediaExternalToolElementNodeFactory.buildWithId({ parent: lineNode, position: 2 });
			const elementNode3 = mediaExternalToolElementNodeFactory.buildWithId({ parent: lineNode, position: 1 });

			const domainObject = new BoardDoBuilderImpl([elementNode1, elementNode2, elementNode3]).buildMediaLine(lineNode);

			const cardIds = domainObject.children.map((el) => el.id);
			expect(cardIds).toEqual([elementNode3.id, elementNode2.id, elementNode1.id]);
		});
	});

	describe('when building a media external tool element', () => {
		it('should work without descendants', () => {
			const mediaExternalToolElementNode = mediaExternalToolElementNodeFactory.build();

			const domainObject = new BoardDoBuilderImpl().buildMediaExternalToolElement(mediaExternalToolElementNode);

			expect(domainObject.constructor.name).toBe(MediaExternalToolElement.name);
		});

		it('should throw error if externalToolElement is not a leaf', () => {
			const mediaExternalToolElementNode = mediaExternalToolElementNodeFactory.buildWithId();
			const columnNode = columnNodeFactory.buildWithId({ parent: mediaExternalToolElementNode });

			expect(() => {
				new BoardDoBuilderImpl([columnNode]).buildMediaExternalToolElement(mediaExternalToolElementNode);
			}).toThrowError();
		});
	});

	describe('ensure board node types', () => {
		it('should do nothing if type is correct', () => {
			const card = cardNodeFactory.build();
			expect(() => new BoardDoBuilderImpl().ensureBoardNodeType(card, BoardNodeType.CARD)).not.toThrowError();
		});

		it('should do nothing if one of the types is correct', () => {
			const card = cardNodeFactory.build();
			expect(() =>
				new BoardDoBuilderImpl().ensureBoardNodeType(card, [BoardNodeType.COLUMN, BoardNodeType.CARD])
			).not.toThrowError();
		});

		it('should throw error if wrong type', () => {
			const card = cardNodeFactory.build();
			expect(() => new BoardDoBuilderImpl().ensureBoardNodeType(card, BoardNodeType.COLUMN)).toThrowError();
		});

		it('should throw error if one of multiple board nodes has the wrong type', () => {
			const column = columnNodeFactory.build();
			const card = cardNodeFactory.build();
			expect(() => new BoardDoBuilderImpl().ensureBoardNodeType([card, column], BoardNodeType.COLUMN)).toThrowError();
		});
	});

	it('should delegate to the board node', () => {
		const richTextElementNode = richTextElementNodeFactory.build();
		jest.spyOn(richTextElementNode, 'useDoBuilder');

		const builder = new BoardDoBuilderImpl();
		builder.buildDomainObject(richTextElementNode);

		expect(richTextElementNode.useDoBuilder).toHaveBeenCalledWith(builder);
	});

	it('should delegate to the board node', () => {
		const fileElementNode = fileElementNodeFactory.build();
		jest.spyOn(fileElementNode, 'useDoBuilder');

		const builder = new BoardDoBuilderImpl();
		builder.buildDomainObject(fileElementNode);

		expect(fileElementNode.useDoBuilder).toHaveBeenCalledWith(builder);
	});
});
