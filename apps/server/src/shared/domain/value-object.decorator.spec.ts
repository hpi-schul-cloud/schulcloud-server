import { IsInt, IsString } from 'class-validator';
import { ValueObject } from './value-object.decorator';

interface TestVOProps {
	a: number;
	b: string;
}

@ValueObject()
export class TestVO {
	@IsInt()
	public readonly integer: number;

	@IsString()
	public readonly string: string;

	constructor(props: TestVOProps) {
		this.integer = props.a;
		this.string = props.b;
	}
}

describe('ValueObject Decorator', () => {
	describe('when creating a valid Value Object', () => {
		it('should create an instance without errors', () => {
			const props = { a: 1, b: 'test' };
			const vo = new TestVO(props);

			expect(vo).toBeInstanceOf(TestVO);
			expect(vo.integer).toBe(1);
			expect(vo.string).toBe('test');
		});
	});

	describe('when creating an invalid Value Object', () => {
		it('should throw validation errors', () => {
			const props = { a: 1, b: 123 };
			//@ts-expect-error
			expect(() => new TestVO(props)).toThrow('isString');
		});
	});
});
