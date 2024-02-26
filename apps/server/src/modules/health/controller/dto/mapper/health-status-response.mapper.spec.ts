import { HealthStatusResponseMapper } from './health-status-response.mapper';
import { HealthStatus, HealthStatusCheck } from '../../../domain';
import { HealthStatusResponse, HealthStatusCheckResponse } from '../response';

describe(HealthStatusResponseMapper.name, () => {
	describe(HealthStatusResponseMapper.mapToResponse.name, () => {
		const testStatus = 'warn';
		const testRequiredStatusProps = { status: testStatus };

		describe('when called with just the required fields', () => {
			const setup = () => {
				const testHealthStatus = new HealthStatus(testRequiredStatusProps);
				const expectedMappedResponse = new HealthStatusResponse(testRequiredStatusProps);

				return { testHealthStatus, expectedMappedResponse };
			};

			it('should map to a valid object', () => {
				const { testHealthStatus, expectedMappedResponse } = setup();

				const mappedResponse = HealthStatusResponseMapper.mapToResponse(testHealthStatus);

				expect(mappedResponse).toStrictEqual<HealthStatusResponse>(expectedMappedResponse);
			});
		});

		describe('when called with all the top-level fields', () => {
			const testDescription = 'System health status';
			const testOutput = 'High RAM usage';
			const testStatusProps = {
				status: testStatus,
				description: testDescription,
				output: testOutput,
			};
			const testCheckKey = 'memory:utilization';
			const testCheckProps = {
				componentType: 'system',
				componentId: '163e5371-f2ee-4a19-b02d-8bfecb769219',
				observedValue: 42,
				observedUnit: 'percent',
				status: testStatus,
				time: new Date(),
				output: 'High RAM usage',
			};

			describe('without any checks', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus(testStatusProps);
					const expectedMappedResponse = new HealthStatusResponse(testStatusProps);

					return { testHealthStatus, expectedMappedResponse };
				};

				it('should map to a valid object', () => {
					const { testHealthStatus, expectedMappedResponse } = setup();

					const mappedResponse = HealthStatusResponseMapper.mapToResponse(testHealthStatus);

					expect(mappedResponse).toStrictEqual<HealthStatusResponse>(expectedMappedResponse);
				});
			});

			describe('with a single check', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus({
						...testStatusProps,
						checks: {
							[testCheckKey]: [new HealthStatusCheck(testCheckProps)],
						},
					});
					const expectedMappedResponse = new HealthStatusResponse({
						...testStatusProps,
						checks: {
							[testCheckKey]: [new HealthStatusCheckResponse(testCheckProps)],
						},
					});

					return { testHealthStatus, expectedMappedResponse };
				};

				it('should map to a valid object', () => {
					const { testHealthStatus, expectedMappedResponse } = setup();

					const mappedResponse = HealthStatusResponseMapper.mapToResponse(testHealthStatus);

					expect(mappedResponse).toStrictEqual<HealthStatusResponse>(expectedMappedResponse);
				});
			});

			describe('with three checks', () => {
				const setup = () => {
					const secondTestCheckKey = 'mongoDB:totalSpaceUsage';
					const secondTestCheckProps = {
						componentType: 'datastore',
						componentId: 'd83419eb-d0d7-4237-a2de-265a14d15531',
						observedValue: 10.32,
						observedUnit: 'PB',
						status: testStatus,
						time: new Date(),
						output: 'High total space usage',
					};
					const thirdTestCheckKey = 'disk:spaceUsage';
					const thirdTestCheckProps = {
						componentType: 'system',
						componentId: 'dd7babd7-932a-44d2-9c3f-a359b8ccd86d',
						observedValue: 24,
						observedUnit: 'percent',
						status: 'pass',
						time: new Date(),
					};
					const testHealthStatus = new HealthStatus({
						...testStatusProps,
						checks: {
							[testCheckKey]: [new HealthStatusCheck(testCheckProps)],
							[secondTestCheckKey]: [new HealthStatusCheck(secondTestCheckProps)],
							[thirdTestCheckKey]: [new HealthStatusCheck(thirdTestCheckProps)],
						},
					});
					const expectedMappedResponse = new HealthStatusResponse({
						...testStatusProps,
						checks: {
							[testCheckKey]: [new HealthStatusCheckResponse(testCheckProps)],
							[secondTestCheckKey]: [new HealthStatusCheckResponse(secondTestCheckProps)],
							[thirdTestCheckKey]: [new HealthStatusCheckResponse(thirdTestCheckProps)],
						},
					});

					return { testHealthStatus, expectedMappedResponse };
				};

				it('should map to a valid object', () => {
					const { testHealthStatus, expectedMappedResponse } = setup();

					const mappedResponse = HealthStatusResponseMapper.mapToResponse(testHealthStatus);

					expect(mappedResponse).toStrictEqual<HealthStatusResponse>(expectedMappedResponse);
				});
			});
		});
	});
});
