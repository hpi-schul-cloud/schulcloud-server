import { HealthStatusCheck } from './health-status-check.do';
import { HealthStatuses } from './health-statuses.do';

describe(HealthStatusCheck.name, () => {
	describe('isPassed', () => {
		describe(`when called on a status check with a '${HealthStatuses.STATUS_PASS}' health status`, () => {
			const setup = () => {
				const testHealthStatusCheck = new HealthStatusCheck({
					componentType: 'system',
					status: HealthStatuses.STATUS_PASS,
				});

				return { testHealthStatusCheck };
			};

			it(`should return 'true'`, () => {
				const { testHealthStatusCheck } = setup();

				const result = testHealthStatusCheck.isPassed();

				expect(result).toEqual(true);
			});
		});

		describe(`when called on a status check with a '${HealthStatuses.STATUS_FAIL}' health status`, () => {
			const setup = () => {
				const testHealthStatusCheck = new HealthStatusCheck({
					componentType: 'system',
					status: HealthStatuses.STATUS_FAIL,
				});

				return { testHealthStatusCheck };
			};

			it(`should return 'false'`, () => {
				const { testHealthStatusCheck } = setup();

				const result = testHealthStatusCheck.isPassed();

				expect(result).toEqual(false);
			});
		});
	});
});
