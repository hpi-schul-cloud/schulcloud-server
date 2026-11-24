import { validateSync } from 'class-validator';
import { BoardImportConfig } from './board-import.config';

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

				expect(errors[0].constraints).toHaveProperty('max');
			});
		});
	});
});
