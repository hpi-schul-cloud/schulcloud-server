import { HealthStatus, HealthStatuses } from '@src/modules/health/domain/health-status.do';

describe(HealthStatus.name, () => {
	describe('isPassed', () => {
		describe('should return', () => {
			it(`'true' in case of a '${HealthStatuses.STATUS_PASS}' health status`, () => {
				const testHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_PASS });

				const result = testHealthStatus.isPassed();

				expect(result).toBe(true);
			});

			it("'false' in case of a 'fail' health status", () => {
				const testHealthStatus = new HealthStatus({ status: HealthStatuses.STATUS_FAIL });

				const result = testHealthStatus.isPassed();

				expect(result).toBe(false);
			});
		});
	});
});
