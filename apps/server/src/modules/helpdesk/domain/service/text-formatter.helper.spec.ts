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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 1.0.0
Betriebssystem: Test OS
Gerät: Desktop [auto-detection: Test User Agent]
Problembereich: General \n

User meldet folgendes:
Problem Kurzbeschreibung: Test Problem Subject
Problembeschreibung: Test problem description
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 1.0.0
Betriebssystem: Test OS
Gerät:  [auto-detection: Test User Agent]
Problembereich: General \n

User meldet folgendes:
Problem Kurzbeschreibung: Test Problem Subject
Problembeschreibung: Test problem description
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 1.0.0
Betriebssystem: Test OS
Gerät: Desktop [auto-detection: Test User Agent]
Problembereich: General \n

User meldet folgendes:
Problem Kurzbeschreibung: Test Problem Subject
Problembeschreibung: Test problem description
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: 
Browser Version: 
Betriebssystem: 
Gerät: Desktop [auto-detection: ]
Problembereich: General \n

User meldet folgendes:
Problem Kurzbeschreibung: Test Problem Subject
Problembeschreibung: Test problem description
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 1.0.0
Betriebssystem: Test OS
Gerät:  [auto-detection: Test User Agent]
Problembereich: General \n

User schrieb folgendes: Test Wish Subject \n
Als As a user
möchte ich I want to test,
um So I can verify functionality.
Akzeptanzkriterien: Feature works as expected
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 1.0.0
Betriebssystem: Test OS
Gerät:  [auto-detection: Test User Agent]
Problembereich: General \n

User schrieb folgendes: Test Wish Subject \n
Als As a user
möchte ich I want to test,
um So I can verify functionality.
Akzeptanzkriterien: 
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 1.0.0
Betriebssystem: Test OS
Gerät:  [auto-detection: Test User Agent]
Problembereich: General \n

User schrieb folgendes: Test Wish Subject \n
Als As a user
möchte ich I want to test,
um So I can verify functionality.
Akzeptanzkriterien: Feature works as expected
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: 
Browser Version: 
Betriebssystem: 
Gerät:  [auto-detection: ]
Problembereich: General \n

User schrieb folgendes: Test Wish Subject \n
Als As a user
möchte ich I want to test,
um So I can verify functionality.
Akzeptanzkriterien: Feature works as expected
`;

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

				const expected = `
SystemInformation:
User login: Test User
User role(s): student
User registrated email: testuser@example.com \n

ReplyEmail: test@example.com
User: Test User
User-ID: test-user-id
Schule: Test School
Schule-ID: test-school-id
Instanz: Test Instance
Browser: Test Browser
Browser Version: 
Betriebssystem: 
Gerät:  [auto-detection: ]
Problembereich: General \n

User schrieb folgendes: Test Wish Subject \n
Als As a user
möchte ich I want to test,
um So I can verify functionality.
Akzeptanzkriterien: Feature works as expected
`;

				expect(result).toBe(expected);
			});
		});
	});
});
