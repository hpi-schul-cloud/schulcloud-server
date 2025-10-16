import { TspMissingExternalIdLoggable } from './tsp-missing-external-id.loggable';

describe(TspMissingExternalIdLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const objectType = 'teacher';

			const expected = {
				message: `A ${objectType} is missing an id. It is skipped.`,
				data: {
					objectType,
				},
			};

			return { objectType, expected };
		};

		it('should return a log message', () => {
			const { objectType, expected } = setup();

			const loggable = new TspMissingExternalIdLoggable(objectType);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
