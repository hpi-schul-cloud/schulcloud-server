import { DoBaseFactory } from './do-base.factory';

class TestClass {
	id?: string;

	constructor(testClass: TestClass) {
		this.id = testClass.id;
	}
}

const testFactory = DoBaseFactory.define<TestClass, TestClass>(TestClass, () => {
	return {};
});

describe('DoBaseFactory', () => {
	describe('buildWithId', () => {
		it('should build a TestClass with the defines id', () => {
			const id = 'id';

			const result: TestClass = testFactory.buildWithId(undefined, id);

			expect(result.id).toEqual(id);
		});

		it('should build a TestClass with a new id', () => {
			const result: TestClass = testFactory.buildWithId();

			expect(result.id).toBeDefined();
		});
	});
});
