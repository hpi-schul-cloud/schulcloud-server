import { boardNodeFactory } from './board-node.factory';
import { INITIAL_PATH, joinPath } from './path-utils';

describe('BoardNode', () => {
	describe('a new instance', () => {
		const setup = () => {
			const boardNode = boardNodeFactory.build();

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

		it('should have initial path', () => {
			const { boardNode } = setup();
			expect(boardNode.path).toBe(INITIAL_PATH);
		});
	});

	describe('when adding to a parent', () => {
		const setup = () => {
			const parent = boardNodeFactory.build();
			const child = boardNodeFactory.build();

			return { parent, child };
		};

		it('should update the ancestor list', () => {
			const { parent, child } = setup();

			child.addToParent(parent);

			expect(child.ancestorIds).toEqual([parent.id]);
		});

		it('should update the children of the parent', () => {
			const { parent, child } = setup();

			child.addToParent(parent);

			expect(parent.children).toEqual([child]);
		});

		it('should update the level of the child', () => {
			const { parent, child } = setup();

			child.addToParent(parent);

			expect(child.level).toEqual(1);
		});

		it('should update the path', () => {
			const { parent, child } = setup();

			child.addToParent(parent);

			expect(child.path).toEqual(joinPath(parent.path, parent.id));
		});
	});

	describe('when adding a child', () => {
		const setup = () => {
			const parent = boardNodeFactory.build();
			const child = boardNodeFactory.build();

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
	});

	describe('when removing from a parent', () => {
		const setup = () => {
			const parent = boardNodeFactory.build();
			const child = boardNodeFactory.build();
			child.addToParent(parent);

			return { parent, child };
		};

		it('should update the ancestor list', () => {
			const { parent, child } = setup();

			child.removeFromParent(parent);

			expect(child.ancestorIds).toEqual([]);
		});

		it('should update the children of the parent', () => {
			const { parent, child } = setup();

			child.removeFromParent(parent);

			expect(parent.children).toEqual([]);
		});

		it('should update the level of the child', () => {
			const { parent, child } = setup();

			child.removeFromParent(parent);

			expect(child.level).toEqual(0);
		});

		it('should update the path', () => {
			const { parent, child } = setup();

			child.removeFromParent(parent);

			expect(child.path).toEqual(INITIAL_PATH);
		});
	});

	describe('when removing a child', () => {
		const setup = () => {
			const parent = boardNodeFactory.build();
			const child = boardNodeFactory.build();
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

			expect(child.path).toEqual(INITIAL_PATH);
		});
	});
});
