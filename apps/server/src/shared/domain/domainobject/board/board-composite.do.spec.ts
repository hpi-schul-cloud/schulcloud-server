import { ObjectId } from 'bson';
import { BoardComposite } from './board-composite.do';
import { AnyBoardDo } from './types';

class BoardObject extends BoardComposite {
	addChild(domainObject: AnyBoardDo, position?: number) {
		this._addChild(domainObject, position);
	}
}

const buildBoardObject = () =>
	new BoardObject({
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	});

describe(`${BoardComposite.name}`, () => {
	const setup = () => {
		const parent = buildBoardObject();
		parent.addChild(buildBoardObject() as AnyBoardDo);
		parent.addChild(buildBoardObject() as AnyBoardDo);
		parent.addChild(buildBoardObject() as AnyBoardDo);

		return { parent, children: parent.children };
	};

	describe('getChild', () => {
		it('should throw an error if child is not found', () => {
			const { parent } = setup();
			expect(() => parent.getChild('59a3c657a2049554a93fec3a')).toThrow();
		});
	});

	describe('removeChild', () => {
		it('should remove the child', () => {
			const { parent, children } = setup();
			const expectedChildren = [children[0], children[2]];

			parent.removeChild(children[1].id);

			expect(parent.children).toEqual(expectedChildren);
		});
	});

	describe('addChild', () => {
		it('should add the child at the requested position', () => {
			const { parent, children } = setup();
			const extraChild = buildBoardObject();
			const expectedChildren = [children[0], extraChild, children[1], children[2]];

			parent.addChild(extraChild as AnyBoardDo, 1);

			expect(children).toEqual(expectedChildren);
		});

		describe('when position is not given', () => {
			it('should append the child', () => {
				const { parent, children } = setup();
				const extraChild = buildBoardObject();
				const expectedChildren = [...children, extraChild];

				parent.addChild(extraChild as AnyBoardDo);

				expect(children).toEqual(expectedChildren);
			});
		});

		describe('when position = 0', () => {
			it('should prepend the child', () => {
				const { parent, children } = setup();
				const extraChild = buildBoardObject();
				const expectedChildren = [extraChild, ...children];

				parent.addChild(extraChild as AnyBoardDo, 0);

				expect(children).toEqual(expectedChildren);
			});
		});

		describe('when position is too large', () => {
			it('should append the child', () => {
				const { parent, children } = setup();
				const extraChild = buildBoardObject();
				const expectedChildren = [...children, extraChild];

				parent.addChild(extraChild as AnyBoardDo, 42);

				expect(children).toEqual(expectedChildren);
			});
		});
	});
});
