import { HealthStatuses } from './health-statuses.do';
import { HealthStatus } from './health-status.do';
import { HealthStatusCheck } from './health-status-check.do';

describe(HealthStatus.name, () => {
	describe('isPassed', () => {
		describe(`when called on a health status with a '${HealthStatuses.STATUS_PASS}' status`, () => {
			describe('in the general health check (without internal checks)', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_PASS });

					return { testHealthStatus };
				};

				it(`should return 'true'`, () => {
					const { testHealthStatus } = setup();

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(true);
				});
			});

			describe('in all of the internal checks', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus({
						status: HealthStatuses.STATUS_PASS,
						checks: {
							uptime: [
								new HealthStatusCheck({
									componentType: 'system',
									observedValue: 12345.67,
									observedUnit: 's',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
							],
							'cpu:utilization': [
								new HealthStatusCheck({
									componentId: '488a75b5-4873-438b-abdc-1be06e9a7f19',
									componentType: 'system',
									observedValue: 42,
									observedUnit: 'percent',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
							],
							'memory:utilization': [
								new HealthStatusCheck({
									componentId: '77c79744-029d-4598-ae5f-7b7bb1ef0944',
									componentType: 'system',
									observedValue: 1.23,
									observedUnit: 'GiB',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
								new HealthStatusCheck({
									componentId: 'e1a99bd2-3847-411d-836d-e902c9850270',
									componentType: 'system',
									observedValue: 4321,
									observedUnit: 'MiB',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
							],
						},
					});

					return { testHealthStatus };
				};

				it(`should return 'true'`, () => {
					const { testHealthStatus } = setup();

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(true);
				});
			});
		});

		describe(`when called on a health status with a '${HealthStatuses.STATUS_FAIL}' status`, () => {
			describe('in the general health check (without internal checks)', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_FAIL });

					return { testHealthStatus };
				};

				it(`should return 'false'`, () => {
					const { testHealthStatus } = setup();

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(false);
				});
			});

			describe('in a single internal check', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus({
						// The main health status should be HealthStatuses.STATUS_FAIL (if any of the
						// checks fails, the whole health check should also fail), but it was set to
						// HealthStatuses.STATUS_PASS to make sure that 'false' is returned from
						// within the checks verification block. The same logic applies to all the
						// test cases below that verifies the 'false' value returned in case of any
						// of the internal checks fail.
						status: HealthStatuses.STATUS_PASS,
						checks: {
							'cpu:utilization': [
								new HealthStatusCheck({
									componentId: 'e77f3233-f040-4b6a-94cd-2a1f9a890d5d',
									componentType: 'system',
									observedValue: 87,
									observedUnit: 'percent',
									status: HealthStatuses.STATUS_FAIL,
									time: new Date(),
									output: 'High CPU utilization',
								}),
							],
						},
					});

					return { testHealthStatus };
				};

				it(`should return 'false'`, () => {
					const { testHealthStatus } = setup();

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(false);
				});
			});

			describe('in any of the many internal checks', () => {
				const setup = () => {
					const testHealthStatus = new HealthStatus({
						status: HealthStatuses.STATUS_PASS,
						checks: {
							uptime: [
								new HealthStatusCheck({
									componentType: 'system',
									observedValue: 12345.67,
									observedUnit: 's',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
							],
							'cpu:utilization': [
								new HealthStatusCheck({
									componentId: '488a75b5-4873-438b-abdc-1be06e9a7f19',
									componentType: 'system',
									observedValue: 42,
									observedUnit: 'percent',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
								new HealthStatusCheck({
									componentId: 'e77f3233-f040-4b6a-94cd-2a1f9a890d5d',
									componentType: 'system',
									observedValue: 87,
									observedUnit: 'percent',
									status: HealthStatuses.STATUS_FAIL,
									time: new Date(),
									output: 'High CPU utilization',
								}),
							],
							'memory:utilization': [
								new HealthStatusCheck({
									componentId: '77c79744-029d-4598-ae5f-7b7bb1ef0944',
									componentType: 'system',
									observedValue: 1.23,
									observedUnit: 'GiB',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
								new HealthStatusCheck({
									componentId: 'e1a99bd2-3847-411d-836d-e902c9850270',
									componentType: 'system',
									observedValue: 4321,
									observedUnit: 'MiB',
									status: HealthStatuses.STATUS_PASS,
									time: new Date(),
								}),
							],
						},
					});

					return { testHealthStatus };
				};

				it(`should return 'false'`, () => {
					const { testHealthStatus } = setup();

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(false);
				});
			});
		});
	});
});
