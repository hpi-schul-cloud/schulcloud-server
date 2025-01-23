import { PolymorphicArrayTransform } from '@shared/controller/transformer';
import { ClassConstructor, plainToClass } from 'class-transformer';

describe(PolymorphicArrayTransform.name, () => {
	class Str {
		str!: string;
	}

	class Num {
		num!: number;
	}

	class PolymorphicArrayDto {
		@PolymorphicArrayTransform(
			(obj: unknown): ClassConstructor<Str | Num> =>
				typeof obj === 'object' && obj !== null && 'str' in obj ? Str : Num
		)
		input!: (Str | Num)[];
	}

	describe('when input is not an array', () => {
		const setup = () => {
			const data = {
				input: { num: 1, str: 'string' },
			};

			return { data };
		};
		it('should not transform input', () => {
			const { data } = setup();

			const result = plainToClass(PolymorphicArrayDto, data);

			expect(result).toEqual(data);
		});
	});

	describe('when input is an array', () => {
		const setup = () => {
			const data = {
				input: [{ num: 1 }, { str: 'string' }],
			};

			return { data };
		};

		it('should transform input', () => {
			const { data } = setup();

			const result = plainToClass(PolymorphicArrayDto, data);

			expect(result.input).toHaveLength(2);
			expect(result.input[0]).toBeInstanceOf(Num);
			expect(result.input[1]).toBeInstanceOf(Str);
		});
	});
});
