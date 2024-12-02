import { plainToClass } from 'class-transformer';
import { isString, validate } from 'class-validator';
import { ValidateRecord } from './validate-record.validator';

class Dto {
	@ValidateRecord(isString)
	obj!: Record<string, string>;
}

describe('ValidateRecord Validator', () => {
	describe('when the record has only valid values', () => {
		const setup = () => {
			const dto: Dto = {
				obj: {
					string1: 'string1',
					string2: 'string2',
				},
			};

			return {
				dto,
			};
		};

		it('should return no errors', async () => {
			const { dto } = setup();

			const result = await validate(plainToClass(Dto, dto));

			expect(result).toHaveLength(0);
		});
	});

	describe('when the record has an invalid value', () => {
		const setup = () => {
			const dto = {
				obj: {
					string1: 'string1',
					number1: 1,
				},
			};

			return {
				dto,
			};
		};

		it('should return an error', async () => {
			const { dto } = setup();

			const result = await validate(plainToClass(Dto, dto));

			expect(result).toHaveLength(1);
		});
	});

	describe('when the target is not an object', () => {
		const setup = () => {
			const dto = {
				obj: 1,
			};

			return {
				dto,
			};
		};

		it('should return an error', async () => {
			const { dto } = setup();

			const result = await validate(plainToClass(Dto, dto));

			expect(result).toHaveLength(1);
		});
	});

	describe('when the target is null', () => {
		const setup = () => {
			const dto = {
				obj: null,
			};

			return {
				dto,
			};
		};

		it('should return an error', async () => {
			const { dto } = setup();

			const result = await validate(plainToClass(Dto, dto));

			expect(result).toHaveLength(1);
		});
	});
});
