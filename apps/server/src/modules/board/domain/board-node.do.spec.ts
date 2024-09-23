import { cardFactory, columnBoardFactory, columnFactory, linkElementFactory, richTextElementFactory } from '../testing';
import { ExternalToolElement } from './external-tool-element.do';
import { joinPath, ROOT_PATH } from './path-utils';
import { RichTextElement } from './rich-text-element.do';

describe('BoardNode', () => {
	describe('a new instance', () => {
		const setup = () => {
			const boardNode = columnFactory.build();

			return { boardNode };
		};

		it('should have no ancestors', () => {
			const { boardNode } = setup();
			expect(boardNode.ancestorIds).toHaveLength(0);
		});

		it('should have no parent', () => {
			const { boardNode } = setup();
			expect(boardNode.hasParent()).toBe(false);
			expect(boardNode.parentId).not.toBeDefined();
		});

		it('should have level = 0', () => {
			const { boardNode } = setup();
			expect(boardNode.level).toBe(0);
		});

		it('should have root path', () => {
			const { boardNode } = setup();
			expect(boardNode.path).toBe(ROOT_PATH);
		});

		describe('when children are provided', () => {
			const setupWithChildren = () => {
				const boardNode = columnFactory.build({ children: cardFactory.buildList(2) });

				return { boardNode };
			};

			it('should update the paths of children', () => {
				const { boardNode } = setupWithChildren();

				expect(boardNode.children[0].path).toBe(joinPath(boardNode.path, boardNode.id));
				expect(boardNode.children[1].path).toBe(joinPath(boardNode.path, boardNode.id));
			});

			it('should update the positions of children', () => {
				const { boardNode } = setupWithChildren();

				expect(boardNode.children[0].position).toBe(0);
				expect(boardNode.children[1].position).toBe(1);
			});
		});
	});

	describe('when adding a child', () => {
		const setup = () => {
			const parent = columnFactory.build();
			const child = cardFactory.build();
			const extraChild = cardFactory.build();

			return { parent, child, extraChild };
		};

		it('should update the ancestor list', () => {
			const { parent, child } = setup();

			parent.addChild(child);

			expect(child.ancestorIds).toEqual([parent.id]);
		});

		it('should update the children of the parent', () => {
			const { parent, child } = setup();

			parent.addChild(child);

			expect(parent.children).toEqual([child]);
		});

		it('should update the level of the child', () => {
			const { parent, child } = setup();

			parent.addChild(child);

			expect(child.level).toEqual(1);
		});

		it('should update the path of the child', () => {
			const { parent, child } = setup();

			parent.addChild(child);

			expect(child.path).toEqual(joinPath(parent.path, parent.id));
		});

		it('should update the position of the child', () => {
			const { parent, child, extraChild } = setup();

			parent.addChild(child);
			parent.addChild(extraChild);

			expect(child.position).toBe(0);
			expect(extraChild.position).toBe(1);
		});

		describe('when child already exists', () => {
			const setupWithChild = () => {
				const child = cardFactory.build();
				const parent = columnFactory.build({ children: [child] });

				return { parent, existingChild: child };
			};

			it('should thow an error', () => {
				const { parent, existingChild } = setupWithChild();

				expect(() => parent.addChild(existingChild)).toThrowError();
			});
		});

		describe('when position is given', () => {
			describe('when position is valid', () => {
				it('should insert at proper position', () => {
					const { parent, child, extraChild } = setup();

					parent.addChild(child, 0);
					parent.addChild(extraChild, 0);

					expect(parent.children.map((n) => n.id)).toEqual([extraChild.id, child.id]);
				});

				it('should update child + siblings positions', () => {
					const { parent, child, extraChild } = setup();

					parent.addChild(child, 0);
					parent.addChild(extraChild, 0);

					expect(extraChild.position).toBe(0);
					expect(child.position).toBe(1);
				});
			});

			describe('when position < 0', () => {
				it('should thow an error', () => {
					const { parent, child } = setup();

					expect(() => parent.addChild(child, -1)).toThrowError();
				});
			});

			describe('when position > length', () => {
				it('should thow an error', () => {
					const { parent, child } = setup();

					expect(() => parent.addChild(child, 1)).toThrowError();
				});
			});
		});

		describe('when position omitted', () => {
			it('should append the child', () => {
				const { parent, child, extraChild } = setup();

				parent.addChild(child);
				parent.addChild(extraChild);

				expect(parent.children.map((n) => n.id)).toEqual([child.id, extraChild.id]);
			});

			it('should update child position', () => {
				const { parent, child, extraChild } = setup();

				parent.addChild(child);
				parent.addChild(extraChild);

				expect(parent.children.map((n) => n.position)).toEqual([0, 1]);
			});
		});

		describe('when child is not allowed to add', () => {
			it('should throw an error', () => {
				const { parent, child } = setup();

				expect(() => child.addChild(parent)).toThrowError();
			});
		});
	});

	describe('constructor', () => {
		const setup = () => {
			const column = columnFactory.build();
			const board = columnBoardFactory.build({ children: [column] });
			return { board, column };
		};

		it('should add children', () => {
			const { board, column } = setup();

			expect(board.children).toEqual([column]);
		});

		it('should update path of children', () => {
			const { board, column } = setup();

			expect(column.ancestorIds).toEqual([board.id]);
		});

		it('should update level of children', () => {
			const { board, column } = setup();

			expect(column.level).toEqual(board.level + 1);
		});
	});

	describe('when removing a child', () => {
		const setup = () => {
			const parent = columnFactory.build();
			const child = cardFactory.build();
			const extraChild = cardFactory.build();
			parent.addChild(child);

			return { parent, child, extraChild };
		};

		it('should update the ancestor list', () => {
			const { parent, child } = setup();

			parent.removeChild(child);

			expect(child.ancestorIds).toEqual([]);
		});

		it('should update the children of the parent', () => {
			const { parent, child } = setup();

			parent.removeChild(child);

			expect(parent.children).toEqual([]);
		});

		it('should update the level of the child', () => {
			const { parent, child } = setup();

			parent.removeChild(child);

			expect(child.level).toEqual(0);
		});

		it('should update the path of the child', () => {
			const { parent, child } = setup();

			parent.removeChild(child);

			expect(child.path).toEqual(ROOT_PATH);
		});

		it('should update child position', () => {
			const { parent, child, extraChild } = setup();
			parent.addChild(extraChild);

			parent.removeChild(child);

			expect(parent.children.map((n) => n.position)).toEqual([0]);
		});
	});

	describe('hasChild', () => {
		const setup = () => {
			const parent = columnFactory.build({ children: cardFactory.buildList(1) });
			const child = parent.children[0];
			const extraChild = cardFactory.build({ id: child.id });

			return { parent, child, extraChild };
		};

		it('should check by reference', () => {
			const { parent, child, extraChild } = setup();

			expect(parent.hasChild(child)).toBe(true);
			expect(parent.hasChild(extraChild)).toBe(false);
		});
	});

	describe('isRoot', () => {
		const setup = () => {
			const parent = columnFactory.build({ children: cardFactory.buildList(1) });
			const child = parent.children[0];

			return { parent, child };
		};

		describe(`when there's no parent`, () => {
			it('should return true', () => {
				const { parent } = setup();

				expect(parent.isRoot()).toBe(true);
			});
		});

		describe(`when having a parent`, () => {
			it('should return false', () => {
				const { child } = setup();

				expect(child.isRoot()).toBe(false);
			});
		});
	});

	describe('rootId', () => {
		const setup = () => {
			const parent = columnFactory.build({ children: cardFactory.buildList(1) });
			const child = parent.children[0];

			return { parent, child };
		};

		describe(`when there's no parent`, () => {
			it('should return the own id', () => {
				const { parent } = setup();

				expect(parent.rootId).toBe(parent.id);
			});
		});

		describe(`when having a parent`, () => {
			it('should return the id of the parent', () => {
				const { parent, child } = setup();

				expect(child.rootId).toBe(parent.id);
			});
		});
	});

	describe('getChildrenOfType', () => {
		const setup = () => {
			const richTextElementsOnCard1 = richTextElementFactory.buildList(1);
			const richTextElementsOnCard2 = richTextElementFactory.buildList(2);
			const parent = columnFactory.build({
				children: [
					cardFactory.build({
						children: [...richTextElementsOnCard1, linkElementFactory.build()],
					}),
					cardFactory.build({
						children: richTextElementsOnCard2,
					}),
				],
			});

			return {
				parent,
				richTextElementsOnCard1,
				richTextElementsOnCard2,
			};
		};

		describe('when the parent has children of the given type', () => {
			it('should return the children', () => {
				const { parent, richTextElementsOnCard1, richTextElementsOnCard2 } = setup();

				const result = parent.getChildrenOfType(RichTextElement);

				expect(result).toEqual([...richTextElementsOnCard1, ...richTextElementsOnCard2]);
			});
		});

		describe('when there is no child with the given type', () => {
			it('should return an empty array', () => {
				const { parent } = setup();

				const result = parent.getChildrenOfType(ExternalToolElement);

				expect(result).toEqual([]);
			});
		});
	});
});
