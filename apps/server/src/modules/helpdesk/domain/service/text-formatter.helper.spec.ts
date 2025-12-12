import {
	helpdeskProblemPropsFactory,
	helpdeskWishPropsFactory,
	userContextPropsFactory,
	userDevicePropsFactory,
} from '../../testing';
import { TextFormatter } from './text-formatter.helper';

describe('TextFormatter', () => {
	describe('createProblemText', () => {
		describe('when all information is provided with consent', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();

				return { problem, userContext, userDevice };
			};

			it('should return formatted problem text with all information', () => {
				const { problem, userContext, userDevice } = setup();

				const result = TextFormatter.createProblemText(problem, userContext, userDevice);

				const expected =
					'Helpdesk Problem Submission\n\n' +
					'--- Problem Details ---\n' +
					'Subject: Test Problem Subject\n' +
					'Problem Area: General\n' +
					'Problem Description: Test problem description\n' +
					'Device: Desktop\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'Device User Agent: Test User Agent\n' +
					'Browser Name: Test Browser\n' +
					'Browser Version: 1.0.0\n' +
					'Operating System: Test OS\n';

				expect(result).toBe(expected);
			});
		});

		describe('when device information is not provided in problem', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create({
					device: undefined,
				});
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();

				return { problem, userContext, userDevice };
			};

			it('should not include device field in problem details', () => {
				const { problem, userContext, userDevice } = setup();

				const result = TextFormatter.createProblemText(problem, userContext, userDevice);

				const expected =
					'Helpdesk Problem Submission\n\n' +
					'--- Problem Details ---\n' +
					'Subject: Test Problem Subject\n' +
					'Problem Area: General\n' +
					'Problem Description: Test problem description\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'Device User Agent: Test User Agent\n' +
					'Browser Name: Test Browser\n' +
					'Browser Version: 1.0.0\n' +
					'Operating System: Test OS\n';

				expect(result).toBe(expected);
			});
		});

		describe('when consent is not given', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create({
					consent: false,
				});
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();

				return { problem, userContext, userDevice };
			};

			it('should not include device information', () => {
				const { problem, userContext, userDevice } = setup();

				const result = TextFormatter.createProblemText(problem, userContext, userDevice);

				const expected =
					'Helpdesk Problem Submission\n\n' +
					'--- Problem Details ---\n' +
					'Subject: Test Problem Subject\n' +
					'Problem Area: General\n' +
					'Problem Description: Test problem description\n' +
					'Device: Desktop\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'N/A';

				expect(result).toBe(expected);
			});
		});

		describe('when userDevice is undefined', () => {
			const setup = () => {
				const problem = helpdeskProblemPropsFactory.create();
				const userContext = userContextPropsFactory.create();

				return { problem, userContext };
			};

			it('should display no device information provided', () => {
				const { problem, userContext } = setup();

				const result = TextFormatter.createProblemText(problem, userContext, undefined);

				const expected =
					'Helpdesk Problem Submission\n\n' +
					'--- Problem Details ---\n' +
					'Subject: Test Problem Subject\n' +
					'Problem Area: General\n' +
					'Problem Description: Test problem description\n' +
					'Device: Desktop\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'No device information provided.';

				expect(result).toBe(expected);
			});
		});
	});

	describe('createWishText', () => {
		describe('when all information is provided with consent', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();

				return { wish, userContext, userDevice };
			};

			it('should return formatted wish text with all information', () => {
				const { wish, userContext, userDevice } = setup();

				const result = TextFormatter.createWishText(wish, userContext, userDevice);

				const expected =
					'Helpdesk Wish Submission\n\n' +
					'--- Wish Details ---\n' +
					'Subject: Test Wish Subject\n' +
					'Problem Area: General\n' +
					'Role: As a user\n' +
					'Desire: I want to test\n' +
					'Benefit: So I can verify functionality\n' +
					'Acceptance Criteria: Feature works as expected\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'Device User Agent: Test User Agent\n' +
					'Browser Name: Test Browser\n' +
					'Browser Version: 1.0.0\n' +
					'Operating System: Test OS\n';

				expect(result).toBe(expected);
			});
		});

		describe('when acceptance criteria is not provided', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create({
					acceptanceCriteria: undefined,
				});
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();

				return { wish, userContext, userDevice };
			};

			it('should not include acceptance criteria in wish details', () => {
				const { wish, userContext, userDevice } = setup();

				const result = TextFormatter.createWishText(wish, userContext, userDevice);

				const expected =
					'Helpdesk Wish Submission\n\n' +
					'--- Wish Details ---\n' +
					'Subject: Test Wish Subject\n' +
					'Problem Area: General\n' +
					'Role: As a user\n' +
					'Desire: I want to test\n' +
					'Benefit: So I can verify functionality\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'Device User Agent: Test User Agent\n' +
					'Browser Name: Test Browser\n' +
					'Browser Version: 1.0.0\n' +
					'Operating System: Test OS\n';

				expect(result).toBe(expected);
			});
		});

		describe('when consent is not given', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create({
					consent: false,
				});
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create();

				return { wish, userContext, userDevice };
			};

			it('should not include device information', () => {
				const { wish, userContext, userDevice } = setup();

				const result = TextFormatter.createWishText(wish, userContext, userDevice);

				const expected =
					'Helpdesk Wish Submission\n\n' +
					'--- Wish Details ---\n' +
					'Subject: Test Wish Subject\n' +
					'Problem Area: General\n' +
					'Role: As a user\n' +
					'Desire: I want to test\n' +
					'Benefit: So I can verify functionality\n' +
					'Acceptance Criteria: Feature works as expected\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'N/A';

				expect(result).toBe(expected);
			});
		});

		describe('when userDevice is undefined', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create();
				const userContext = userContextPropsFactory.create();

				return { wish, userContext };
			};

			it('should display no device information provided', () => {
				const { wish, userContext } = setup();

				const result = TextFormatter.createWishText(wish, userContext, undefined);

				const expected =
					'Helpdesk Wish Submission\n\n' +
					'--- Wish Details ---\n' +
					'Subject: Test Wish Subject\n' +
					'Problem Area: General\n' +
					'Role: As a user\n' +
					'Desire: I want to test\n' +
					'Benefit: So I can verify functionality\n' +
					'Acceptance Criteria: Feature works as expected\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'No device information provided.';

				expect(result).toBe(expected);
			});
		});

		describe('when userDevice has partial information', () => {
			const setup = () => {
				const wish = helpdeskWishPropsFactory.create();
				const userContext = userContextPropsFactory.create();
				const userDevice = userDevicePropsFactory.create({
					deviceUserAgent: undefined,
					browserVersion: undefined,
					os: undefined,
				});

				return { wish, userContext, userDevice };
			};

			it('should display N/A for missing device fields', () => {
				const { wish, userContext, userDevice } = setup();

				const result = TextFormatter.createWishText(wish, userContext, userDevice);

				const expected =
					'Helpdesk Wish Submission\n\n' +
					'--- Wish Details ---\n' +
					'Subject: Test Wish Subject\n' +
					'Problem Area: General\n' +
					'Role: As a user\n' +
					'Desire: I want to test\n' +
					'Benefit: So I can verify functionality\n' +
					'Acceptance Criteria: Feature works as expected\n' +
					'\n--- System Information ---\n' +
					'User ID: test-user-id\n' +
					'User Name: Test User\n' +
					'User Email: testuser@example.com\n' +
					'User Roles: student\n' +
					'School ID: test-school-id\n' +
					'School Name: Test School\n' +
					'\n--- Device Information ---\n' +
					'Device User Agent: N/A\n' +
					'Browser Name: Test Browser\n' +
					'Browser Version: N/A\n' +
					'Operating System: N/A\n';

				expect(result).toBe(expected);
			});
		});
	});
});
