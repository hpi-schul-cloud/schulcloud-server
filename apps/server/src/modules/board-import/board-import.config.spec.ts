import { validateSync } from 'class-validator';
import { BoardImportConfig, BoardImportSourceRequestConfig } from './board-import.config';

describe(BoardImportConfig.name, () => {
	describe('jobRetentionInDays', () => {
		const setup = (jobRetentionInDays: number) => {
			const config = new BoardImportConfig();
			config.jobRetentionInDays = jobRetentionInDays;

			return { config };
		};

		describe('when the value is 49 days', () => {
			it('should be valid', () => {
				const { config } = setup(49);

				const errors = validateSync(config);

				expect(errors).toHaveLength(0);
			});
		});

		describe('when the value is above 49 days', () => {
			it('should be invalid', () => {
				const { config } = setup(50);

				const errors = validateSync(config);

				expect(errors).toHaveLength(1);
				expect(errors[0].constraints).toHaveProperty('max');
			});
		});
	});
});

describe(BoardImportSourceRequestConfig.name, () => {
	type Limit = 'requestTimeoutInSeconds' | 'maxResponseSizeInBytes' | 'maxRedirects';

	const setup = (limit?: { property: Limit; value: number }) => {
		const config = new BoardImportSourceRequestConfig();
		if (limit) {
			config[limit.property] = limit.value;
		}

		return { config };
	};

	describe('when no value is set', () => {
		it('should be valid with the default limits', () => {
			const { config } = setup();

			const errors = validateSync(config);

			expect(errors).toHaveLength(0);
			expect(config).toEqual({ requestTimeoutInSeconds: 30, maxResponseSizeInBytes: 10485760, maxRedirects: 3 });
		});
	});

	describe('when no redirect is permitted', () => {
		it('should be valid', () => {
			const { config } = setup({ property: 'maxRedirects', value: 0 });

			const errors = validateSync(config);

			expect(errors).toHaveLength(0);
		});
	});

	describe('when a limit is below its minimum', () => {
		it.each<{ property: Limit; value: number }>([
			{ property: 'requestTimeoutInSeconds', value: 0 },
			{ property: 'maxResponseSizeInBytes', value: 0 },
			{ property: 'maxRedirects', value: -1 },
		])('should be invalid for $property = $value', (limit) => {
			const { config } = setup(limit);

			const errors = validateSync(config);

			expect(errors).toHaveLength(1);
			expect(errors[0].constraints).toHaveProperty('min');
		});
	});

	describe('when the time limit is above the maximum delay of a timer', () => {
		it('should be invalid', () => {
			const { config } = setup({ property: 'requestTimeoutInSeconds', value: 2147484 });

			const errors = validateSync(config);

			expect(errors).toHaveLength(1);
			expect(errors[0].constraints).toHaveProperty('max');
		});
	});
});
