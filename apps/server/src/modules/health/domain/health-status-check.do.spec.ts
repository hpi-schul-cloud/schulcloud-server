import { HealthStatusCheck } from './health-status-check.do';
import { HealthStatuses } from './health-statuses.do';

describe(HealthStatusCheck.name, () => {
	describe('isPassed', () => {
		describe('should return', () => {
			it(`'true' in case of a '${HealthStatuses.STATUS_PASS}' health status`, () => {
				const testHealthStatusCheck = new HealthStatusCheck({
					componentType: 'system',
					status: HealthStatuses.STATUS_PASS,
				});

				const result = testHealthStatusCheck.isPassed();

				expect(result).toEqual(true);
			});

			it(`'false' in case of a '${HealthStatuses.STATUS_FAIL}' health status`, () => {
				const testHealthStatusCheck = new HealthStatusCheck({
					componentType: 'system',
					status: HealthStatuses.STATUS_FAIL,
				});

				const result = testHealthStatusCheck.isPassed();

				expect(result).toEqual(false);
			});
		});
	});
});
