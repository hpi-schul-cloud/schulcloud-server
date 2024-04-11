import { BoardNodeType } from '@shared/domain/entity';
import { BaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { BoardNode } from './board-node.do';
import { ROOT_PATH, joinPath } from './path-utils';
import { AnyBoardNode, BoardNodeProps } from './types';

class TestingBoardNode extends BoardNode<BoardNodeProps> {}

const boardNodeFactory = BaseFactory.define<TestingBoardNode, BoardNodeProps>(TestingBoardNode, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		type: BoardNodeType.CARD, // made up
		path: ROOT_PATH,
		level: 0,
		title: `board node #${sequence}`,
		position: 0,
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

const buildBoardNode = (props?: BoardNodeProps) => boardNodeFactory.build(props) as unknown as AnyBoardNode;

describe('BoardNode', () => {
	describe('a new instance', () => {
		const setup = () => {
			const boardNode = buildBoardNode();

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
			const parent = buildBoardNode();
			const child = buildBoardNode();

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

	describe('when removing a child', () => {
		const setup = () => {
			const parent = buildBoardNode();
			const child = buildBoardNode();
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
});
