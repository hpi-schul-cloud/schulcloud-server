import { ObjectId } from '@mikro-orm/mongodb';
import { BoardComposite, BoardCompositeProps } from './board-composite.do';
import { AnyBoardDo } from './types';

class BoardObject extends BoardComposite<BoardCompositeProps> {
	isAllowedAsChild(): boolean {
		return true;
	}

	accept(): void {}

	async acceptAsync(): Promise<void> {
		await Promise.resolve();
	}
}

class SecondBoardObject extends BoardComposite<BoardCompositeProps> {
	isAllowedAsChild(): boolean {
		return true;
	}

	accept(): void {}

	async acceptAsync(): Promise<void> {
		await Promise.resolve();
	}
}

const buildBoardObject = (): AnyBoardDo =>
	new BoardObject({
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	}) as unknown as AnyBoardDo;

const buildSecondBoardObject = (): AnyBoardDo =>
	new SecondBoardObject({
		id: new ObjectId().toHexString(),
		children: [
			new SecondBoardObject({
				id: new ObjectId().toHexString(),
				children: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}) as unknown as AnyBoardDo,
		],
		createdAt: new Date(),
		updatedAt: new Date(),
	}) as unknown as AnyBoardDo;

describe(`${BoardComposite.name}`, () => {
	const setup = () => {
		const parent = buildBoardObject();
		parent.addChild(buildBoardObject());
		parent.addChild(buildBoardObject());
		parent.addChild(buildBoardObject());
		parent.addChild(buildSecondBoardObject());

		return { parent, children: parent.children };
	};

	describe('removeChild', () => {
		it('should remove the child', () => {
			const { parent, children } = setup();
			const expectedChildren = [children[0], children[2], children[3]];

			parent.removeChild(children[1]);

			expect(parent.children).toEqual(expectedChildren);
		});
	});

	describe('addChild', () => {
		it('should add the child at the requested position', () => {
			const { parent, children } = setup();
			const extraChild = buildBoardObject();
			const expectedChildren = [children[0], extraChild, children[1], children[2], children[3]];

			parent.addChild(extraChild, 1);

			expect(children).toEqual(expectedChildren);
		});

		describe('when position is not given', () => {
			it('should append the child', () => {
				const { parent, children } = setup();
				const extraChild = buildBoardObject();
				const expectedChildren = [...children, extraChild];

				parent.addChild(extraChild);

				expect(children).toEqual(expectedChildren);
			});
		});

		describe('when position = 0', () => {
			it('should prepend the child', () => {
				const { parent, children } = setup();
				const extraChild = buildBoardObject();
				const expectedChildren = [extraChild, ...children];

				parent.addChild(extraChild, 0);

				expect(children).toEqual(expectedChildren);
			});
		});

		describe('when position < 0', () => {
			it('should throw an error', () => {
				const { parent } = setup();
				const extraChild = buildBoardObject();

				expect(() => parent.addChild(extraChild, -1)).toThrow();
			});
		});

		describe('when position is too large', () => {
			it('should throw an error', () => {
				const { parent } = setup();
				const extraChild = buildBoardObject();

				expect(() => parent.addChild(extraChild, 42)).toThrow();
			});
		});

		describe('when the object is not allowed as a child', () => {
			it('should throw an error', () => {
				const { parent } = setup();
				const extraChild = buildBoardObject();

				jest.spyOn(parent, 'isAllowedAsChild').mockReturnValue(false);

				expect(() => parent.addChild(extraChild, 1)).toThrow();
			});
		});

		describe('when the object is already a child', () => {
			it('should throw an error', () => {
				const { parent, children } = setup();

				expect(() => parent.addChild(children[0])).toThrow();
			});
		});
	});

	describe('getChildrenOfType', () => {
		it('should return the children of the given type', () => {
			const { parent, children } = setup();
			const expectedChildren = [children[3].children[0], children[3]];

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const result: SecondBoardObject[] = parent.getChildrenOfType(SecondBoardObject);

			expect(result).toEqual(expectedChildren);
		});
	});
});
