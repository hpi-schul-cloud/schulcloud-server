import { System } from './system.do';
import { OauthConfig } from './oauth-config';

describe('System', () => {
	describe('isEligibleForLdapLogin', () => {
		describe('when the system is of type ldap with an active ldapConfig and no oauthConfig', () => {
			const setup = () => {
				const system = new System({
					id: '123',
					type: 'ldap',
					ldapConfig: {
						active: true,
						url: 'test',
					},
				});

				return { system };
			};

			it('should return true', () => {
				const { system } = setup();

				const result = system.isEligibleForLdapLogin();

				expect(result).toBe(true);
			});
		});

		describe('when the system is not of type ldap', () => {
			const setup = () => {
				const system = new System({
					id: '123',
					type: 'oauth2',
					ldapConfig: {
						active: true,
						url: 'test',
					},
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isEligibleForLdapLogin();

				expect(result).toBe(false);
			});
		});

		describe('when the system has no ldapConfig', () => {
			const setup = () => {
				const system = new System({
					id: '123',
					type: 'ldap',
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isEligibleForLdapLogin();

				expect(result).toBe(false);
			});
		});

		describe('when the system has an inactive ldapConfig', () => {
			const setup = () => {
				const system = new System({
					id: '123',
					type: 'ldap',
					ldapConfig: {
						active: false,
						url: 'test',
					},
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isEligibleForLdapLogin();

				expect(result).toBe(false);
			});
		});

		describe('when the system has an oauthConfig', () => {
			const setup = () => {
				const system = new System({
					id: '123',
					type: 'ldap',
					ldapConfig: {
						active: true,
						url: 'test',
					},
					oauthConfig: new OauthConfig({
						clientId: 'test',
						clientSecret: 'test',
						redirectUri: 'test',
						grantType: 'test',
						tokenEndpoint: 'test',
						authEndpoint: 'test',
						responseType: 'test',
						scope: 'test',
						provider: 'test',
						issuer: 'test',
						jwksEndpoint: 'test',
					}),
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isEligibleForLdapLogin();

				expect(result).toBe(false);
			});
		});
	});
});
