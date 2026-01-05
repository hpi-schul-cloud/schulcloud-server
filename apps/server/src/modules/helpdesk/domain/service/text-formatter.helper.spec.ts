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
					'Helpdesk-Problem melden\n\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Geräte-User-Agent: Test User Agent\n' +
					'Browser-Name: Test Browser\n' +
					'Browser-Version: 1.0.0\n' +
					'Betriebssystem: Test OS\n' +
					'\n--- Problemdetails ---\n' +
					'Betreff: Test Problem Subject\n' +
					'Problemfeld: General\n' +
					'Problembeschreibung: Test problem description\n' +
					'Gerät: Desktop\n';

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
					'Helpdesk-Problem melden\n\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Geräte-User-Agent: Test User Agent\n' +
					'Browser-Name: Test Browser\n' +
					'Browser-Version: 1.0.0\n' +
					'Betriebssystem: Test OS\n' +
					'\n--- Problemdetails ---\n' +
					'Betreff: Test Problem Subject\n' +
					'Problemfeld: General\n' +
					'Problembeschreibung: Test problem description\n';

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
					'Helpdesk-Problem melden\n\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'N/A' +
					'\n--- Problemdetails ---\n' +
					'Betreff: Test Problem Subject\n' +
					'Problemfeld: General\n' +
					'Problembeschreibung: Test problem description\n' +
					'Gerät: Desktop\n';

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
					'Helpdesk-Problem melden\n\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Keine Geräteinformationen vorhanden.' +
					'\n--- Problemdetails ---\n' +
					'Betreff: Test Problem Subject\n' +
					'Problemfeld: General\n' +
					'Problembeschreibung: Test problem description\n' +
					'Gerät: Desktop\n';

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
					'Helpdesk-Wunsch einreichen\n\n' +
					'--- Wunschdetails ---\n' +
					'Betreff: Test Wish Subject\n' +
					'Problemfeld: General\n' +
					'Rolle: As a user\n' +
					'Wunsch: I want to test\n' +
					'Nutzen: So I can verify functionality\n' +
					'Akzeptanzkriterien: Feature works as expected\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Geräte-User-Agent: Test User Agent\n' +
					'Browser-Name: Test Browser\n' +
					'Browser-Version: 1.0.0\n' +
					'Betriebssystem: Test OS\n';

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
					'Helpdesk-Wunsch einreichen\n\n' +
					'--- Wunschdetails ---\n' +
					'Betreff: Test Wish Subject\n' +
					'Problemfeld: General\n' +
					'Rolle: As a user\n' +
					'Wunsch: I want to test\n' +
					'Nutzen: So I can verify functionality\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Geräte-User-Agent: Test User Agent\n' +
					'Browser-Name: Test Browser\n' +
					'Browser-Version: 1.0.0\n' +
					'Betriebssystem: Test OS\n';

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
					'Helpdesk-Wunsch einreichen\n\n' +
					'--- Wunschdetails ---\n' +
					'Betreff: Test Wish Subject\n' +
					'Problemfeld: General\n' +
					'Rolle: As a user\n' +
					'Wunsch: I want to test\n' +
					'Nutzen: So I can verify functionality\n' +
					'Akzeptanzkriterien: Feature works as expected\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
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
					'Helpdesk-Wunsch einreichen\n\n' +
					'--- Wunschdetails ---\n' +
					'Betreff: Test Wish Subject\n' +
					'Problemfeld: General\n' +
					'Rolle: As a user\n' +
					'Wunsch: I want to test\n' +
					'Nutzen: So I can verify functionality\n' +
					'Akzeptanzkriterien: Feature works as expected\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Keine Geräteinformationen vorhanden.';

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
					'Helpdesk-Wunsch einreichen\n\n' +
					'--- Wunschdetails ---\n' +
					'Betreff: Test Wish Subject\n' +
					'Problemfeld: General\n' +
					'Rolle: As a user\n' +
					'Wunsch: I want to test\n' +
					'Nutzen: So I can verify functionality\n' +
					'Akzeptanzkriterien: Feature works as expected\n' +
					'\n--- Systeminformationen ---\n' +
					'Nutzer-ID: test-user-id\n' +
					'Nutzername: Test User\n' +
					'Nutzer-E-Mail: testuser@example.com\n' +
					'Nutzerrollen: student\n' +
					'Schul-ID: test-school-id\n' +
					'Schulname: Test School\n' +
					'\n--- Geräteinformationen ---\n' +
					'Geräte-User-Agent: N/A\n' +
					'Browser-Name: Test Browser\n' +
					'Browser-Version: N/A\n' +
					'Betriebssystem: N/A\n';

				expect(result).toBe(expected);
			});
		});
	});
});
