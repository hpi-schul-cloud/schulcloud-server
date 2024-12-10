import { plainToClass } from 'class-transformer';
import { StringToObject } from './index';

class TestObject {
	string!: string;

	number!: number;

	boolean!: boolean;

	array!: Array<unknown>;
}

class Dto {
	@StringToObject(TestObject)
	obj!: TestObject;
}

describe('StringToObject Decorator', () => {
	describe('when transform a string to an object', () => {
		const setup = () => {
			const obj: TestObject = {
				string: 'test',
				number: 1,
				boolean: true,
				array: [],
			};

			const plain = {
				obj: JSON.stringify(obj),
			};

			return {
				obj,
				plain,
			};
		};

		it('should transform a string to an object', () => {
			const { obj, plain } = setup();

			const result = plainToClass(Dto, plain);

			expect(result.obj).toEqual(obj);
		});
	});

	describe('when the object is already an object', () => {
		const setup = () => {
			const obj: TestObject = {
				string: 'test',
				number: 1,
				boolean: true,
				array: [],
			};

			const plain = {
				obj,
			};

			return {
				obj,
				plain,
			};
		};

		it('should stay an object', () => {
			const { obj, plain } = setup();

			const result = plainToClass(Dto, plain);

			expect(result.obj).toEqual(obj);
		});
	});
});
