import { HealthStatuses } from './health-statuses.do';
import { HealthStatus } from './health-status.do';
import { HealthStatusCheck } from '@src/modules/health/domain/health-status-check.do';

describe(HealthStatus.name, () => {
	describe('isPassed', () => {
		describe('should return', () => {
			describe(`'true' in case of a '${HealthStatuses.STATUS_PASS}' health status`, () => {
				it('in a plain general health check (no internal checks)', () => {
					const testHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_PASS });

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(true);
				});

				it(`in all of the internal checks`, () => {
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

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(true);
				});
			});

			describe(`'false' in case of a '${HealthStatuses.STATUS_FAIL}' health status`, () => {
				it('in a plain general health check (no internal checks)', () => {
					const testHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_FAIL });

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(false);
				});

				it('within a single internal check', () => {
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

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(false);
				});

				it('in one of the many internal checks', () => {
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

					const result = testHealthStatus.isPassed();

					expect(result).toEqual(false);
				});
			});
		});
	});
});
