import { FeatureDisabledLoggableException } from './feature-disabled.loggable-exception';

describe(FeatureDisabledLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const featureName = 'FEATURE_TEST_ENABLED';

			const exception = new FeatureDisabledLoggableException(featureName);

			return {
				exception,
				featureName,
			};
		};

		it('should log the correct message', () => {
			const { exception, featureName } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'FEATURE_DISABLED',
				stack: expect.any(String),
				data: {
					featureName,
				},
			});
		});
	});
});
