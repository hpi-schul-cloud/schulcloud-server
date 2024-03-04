import { HealthStatusCheckResponseMapper } from './health-status-check-response.mapper';
import { HealthStatusCheck } from '../../../domain';
import { HealthStatusCheckResponse } from '../response';

describe(HealthStatusCheckResponseMapper.name, () => {
	describe(HealthStatusCheckResponseMapper.mapToResponse.name, () => {
		const testComponentType = 'system';
		const testStatus = 'warn';

		describe('when called with just the required fields', () => {
			const setup = () => {
				const testRequiredCheckProps = {
					componentType: testComponentType,
					status: testStatus,
				};

				const testHealthStatusCheck = new HealthStatusCheck(testRequiredCheckProps);
				const expectedMappedResponse = new HealthStatusCheckResponse(testRequiredCheckProps);

				return { testHealthStatusCheck, expectedMappedResponse };
			};

			it('should map to a valid object', () => {
				const { testHealthStatusCheck, expectedMappedResponse } = setup();

				const mappedResponse = HealthStatusCheckResponseMapper.mapToResponse(testHealthStatusCheck);

				expect(mappedResponse).toStrictEqual<HealthStatusCheckResponse>(expectedMappedResponse);
			});
		});

		describe('when called with all the available fields', () => {
			const setup = () => {
				const testAllCheckProps = {
					componentType: testComponentType,
					componentId: 'c67e11c8-f1dd-402e-887c-2cadc3d604db',
					observedValue: 42,
					observedUnit: 'percent',
					status: testStatus,
					time: new Date(),
					output: 'High RAM usage',
				};
				const testHealthStatusCheck = new HealthStatusCheck(testAllCheckProps);
				const expectedMappedResponse = new HealthStatusCheckResponse(testAllCheckProps);

				return { testHealthStatusCheck, expectedMappedResponse };
			};

			it('should map to a valid object', () => {
				const { testHealthStatusCheck, expectedMappedResponse } = setup();

				const mappedResponse = HealthStatusCheckResponseMapper.mapToResponse(testHealthStatusCheck);

				expect(mappedResponse).toStrictEqual<HealthStatusCheckResponse>(expectedMappedResponse);
			});
		});
	});
});
