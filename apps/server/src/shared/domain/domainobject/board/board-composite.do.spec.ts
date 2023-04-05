import { BoardComposite } from './board-composite.do';
import { AnyBoardDo } from './types';

class BoardObject extends BoardComposite {
	addChild(domainObject: AnyBoardDo, position?: number) {
		this._addChild(domainObject, position);
	}
}

describe(`${BoardComposite.name}`, () => {
	describe('getChild', () => {
		it('should throw an error if child is not found', () => {
			const boardObject = new BoardObject({
				id: '59a3c657a2049554a93fec3a',
				children: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			expect(() => boardObject.getChild('59a3c657a2049554a93fec3a')).toThrow();
		});
	});
});
