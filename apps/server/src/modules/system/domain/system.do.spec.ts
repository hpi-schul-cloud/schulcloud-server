import { systemFactory } from '@shared/testing';

describe('System', () => {
	describe('isActiveLdapSystem', () => {
		describe('when type is ldap and ldapConfig is active', () => {
			const setup = () => {
				const system = systemFactory.build({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				});

				return { system };
			};

			it('should return true', () => {
				const { system } = setup();

				const result = system.isActiveLdapSystem();

				expect(result).toBe(true);
			});
		});

		describe('when type is ldap and ldapConfig is not active', () => {
			const setup = () => {
				const system = systemFactory.build({
					type: 'ldap',
					ldapConfig: {
						active: false,
					},
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isActiveLdapSystem();

				expect(result).toBe(false);
			});
		});

		describe('when type is not ldap and ldapConfig is active', () => {
			const setup = () => {
				const system = systemFactory.build({
					type: 'test',
					ldapConfig: {
						active: true,
					},
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isActiveLdapSystem();

				expect(result).toBe(false);
			});
		});

		describe('when type is not ldap and ldapConfig is not active', () => {
			const setup = () => {
				const system = systemFactory.build({
					type: 'test',
					ldapConfig: {
						active: false,
					},
				});

				return { system };
			};

			it('should return false', () => {
				const { system } = setup();

				const result = system.isActiveLdapSystem();

				expect(result).toBe(false);
			});
		});
	});
});
