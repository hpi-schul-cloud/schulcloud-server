import { HealthStatusCheckResponseMapper } from './health-status-check-response.mapper';
import { HealthStatusCheck } from '../../../domain';
import { HealthStatusCheckResponse } from '../response';

describe(HealthStatusCheckResponseMapper.name, () => {
	describe(HealthStatusCheckResponseMapper.mapToResponse.name, () => {
		describe('should properly map health status check with', () => {
			const testComponentType = 'system';
			const testStatus = 'warn';
			const testRequiredCheckProps = {
				componentType: testComponentType,
				status: testStatus,
			};
			const testAllCheckProps = {
				componentType: testComponentType,
				componentId: 'c67e11c8-f1dd-402e-887c-2cadc3d604db',
				observedValue: 42,
				observedUnit: 'percent',
				status: testStatus,
				time: new Date(),
				output: 'High RAM usage',
			};

			it('just the required fields', () => {
				const testHealthStatusCheck = new HealthStatusCheck(testRequiredCheckProps);
				const expectedMappedResponse = new HealthStatusCheckResponse(testRequiredCheckProps);

				const mappedResponse = HealthStatusCheckResponseMapper.mapToResponse(testHealthStatusCheck);

				expect(mappedResponse).toStrictEqual<HealthStatusCheckResponse>(expectedMappedResponse);
			});

			it('all the available fields', () => {
				const testHealthStatusCheck = new HealthStatusCheck(testAllCheckProps);
				const expectedMappedResponse = new HealthStatusCheckResponse(testAllCheckProps);

				const mappedResponse = HealthStatusCheckResponseMapper.mapToResponse(testHealthStatusCheck);

				expect(mappedResponse).toStrictEqual<HealthStatusCheckResponse>(expectedMappedResponse);
			});
		});
	});
});
