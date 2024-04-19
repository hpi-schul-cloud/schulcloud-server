import { cardFactory, columnBoardFactory, columnFactory } from '../testing';
import { ROOT_PATH, joinPath } from './path-utils';

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
	});

	describe('when adding a child', () => {
		const setup = () => {
			const parent = columnFactory.build();
			const child = cardFactory.build();

			return { parent, child };
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
				it.todo('should insert at proper position');
			});

			describe('when position < 0', () => {
				it.todo('should thow an error');
			});

			describe('when position > length', () => {
				it.todo('should thow an error');
			});
		});

		describe('when position omitted', () => {
			it.todo('should append the child');
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
			parent.addChild(child);

			return { parent, child };
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
	});

	describe('hasChild', () => {
		it.todo('should check by id');

		// TODO unfortunately we're not able to check by object reference
		// that requrires using the identity map which is not implemented yet
		it.todo('should not be able to check by reference');
	});
});
