import { BoardNode } from './mixing';

describe('Mixing', () => {
	it('Board can be loaded', () => {
		const boardNode = BoardNode.load();
		expect(boardNode).toBeDefined();
	});

	it('Top node is of type board', () => {
		const boardNode = BoardNode.load();
		expect(boardNode.type).toBe('ROOT');
	});

	it('Top node has has isRootable method', () => {
		const boardNode = BoardNode.load();
		expect(boardNode.isRoot).toBeDefined();
	});

	it('Top node isRootable method returns true', () => {
		const boardNode = BoardNode.load();
		expect(boardNode.isRoot()).toBe(true);
	});
});
