import { expect } from 'chai';
import sinon from 'sinon';
import rootPathImport from 'app-root-path'; 
const reqlib = rootPathImport.require;

const { NotAuthenticated } = reqlib('src/errors');

import LdapConfigService from '../../../src/services/ldap-config/service';

describe('LdapConfigService', () => {
	describe('#getOptions', () => {
		it('should fetch relevant options from request params', () => {
			const result = new LdapConfigService().getOptions({
				query: { verifyOnly: 'false', activate: 'true' },
				school: { _id: 'foo', name: 'bar' },
			});
			['school', 'activateSystem', 'saveSystem'].forEach((property) => {
				expect(result).to.haveOwnProperty(property);
			});
			expect(result.school._id).to.equal('foo');
			expect(result.activateSystem).to.equal(true);
			expect(result.saveSystem).to.equal(true);
		});

		it('should set activateSystem to params.activate, but default to true', () => {
			expect(
				new LdapConfigService().getOptions({
					query: { activate: 'true' },
				}).activateSystem
			).to.equal(true);
			expect(
				new LdapConfigService().getOptions({
					query: { activate: 'false' },
				}).activateSystem
			).to.equal(false);
			expect(
				new LdapConfigService().getOptions({
					query: {},
				}).activateSystem
			).to.equal(true);
		});

		it('should set saveSystem to !params.verifyOnly, but default to true', () => {
			expect(
				new LdapConfigService().getOptions({
					query: { verifyOnly: 'true' },
				}).saveSystem
			).to.equal(false);
			expect(
				new LdapConfigService().getOptions({
					query: { verifyOnly: 'false' },
				}).saveSystem
			).to.equal(true);
			expect(
				new LdapConfigService().getOptions({
					query: {},
				}).saveSystem
			).to.equal(true);
		});
	});

	describe('#verifyAndSaveLdapConfig', () => {
		let instance;

		beforeEach(() => {
			instance = new LdapConfigService();
			instance.verifyConfig = sinon.fake.resolves({ ok: true });
			instance.saveConfig = sinon.fake.resolves();
		});

		it('should always verify', async () => {
			const config = { foo: 'bar' };

			await instance.verifyAndSaveLdapConfig(config, {
				saveSystem: true,
				activateSystem: true,
			});
			expect(instance.verifyConfig.calledWith(config)).to.equal(true);
			instance.verifyConfig = sinon.fake.resolves({ ok: true });

			await instance.verifyAndSaveLdapConfig(config, {
				saveSystem: false,
				activateSystem: true,
			});
			expect(instance.verifyConfig.calledWith(config)).to.equal(true);
			instance.verifyConfig = sinon.fake.resolves({ ok: true });

			await instance.verifyAndSaveLdapConfig(config, {
				saveSystem: true,
				activateSystem: false,
			});
			expect(instance.verifyConfig.calledWith(config)).to.equal(true);
			instance.verifyConfig = sinon.fake.resolves({ ok: true });

			await instance.verifyAndSaveLdapConfig(config, {
				saveSystem: false,
				activateSystem: false,
			});
			expect(instance.verifyConfig.calledWith(config)).to.equal(true);
			instance.verifyConfig = sinon.fake.resolves({ ok: true });
		});

		it('should call #saveConfig only if options say so', async () => {
			const config = { foo: 'bar' };

			await instance.verifyAndSaveLdapConfig(config, {
				saveSystem: false,
				activateSystem: true,
			});
			expect(instance.saveConfig.called).to.equal(false);

			await instance.verifyAndSaveLdapConfig(config, {
				saveSystem: true,
				activateSystem: true,
			});
			expect(instance.saveConfig.called).to.equal(true);
		});
	});

	describe('#verifyConfig', () => {
		let instance;
		let mockLdapService;

		beforeEach(() => {
			mockLdapService = {
				disconnect: sinon.fake(),
			};
			instance = new LdapConfigService();
			instance.setup({
				service: (name) => (name === 'ldap' ? mockLdapService : undefined),
			}); // setup with a mock app
		});

		afterEach(() => sinon.restore());

		it('should throw if something unexpected happens', async () => {
			mockLdapService.getUsers = sinon.fake.rejects(new Error('unexpected'));
			expect(instance.verifyConfig({ foo: 'bar' })).to.be.rejectedWith(Error);
		});

		it('should handle known errors', async () => {
			mockLdapService.getUsers = sinon.fake.rejects(new NotAuthenticated('Wrong credentials'));
			const result = await instance.verifyConfig({ foo: 'bar' });
			expect(result.ok).to.equal(false);
			expect(result.errors).to.be.instanceOf(Array).and.to.have.length(1);
			expect(result.errors[0].type).to.equal('WRONG_CREDENTIALS');
			expect(mockLdapService.disconnect.called).to.equal(true);
		});

		it('should set ok to true if everything worked', async () => {
			mockLdapService.getUsers = sinon.fake.resolves([]);
			mockLdapService.getClasses = sinon.fake.resolves([]);
			const result = await instance.verifyConfig({ foo: 'bar' });
			expect(result.ok).to.equal(true);
			expect(mockLdapService.disconnect.called).to.equal(true);
		});

		it('should generate stats based on ldap output', async () => {
			mockLdapService.getUsers = sinon.fake.resolves([1, 2]);
			mockLdapService.getClasses = sinon.fake.resolves([3, 4]);
			sinon.replace(LdapConfigService, 'generateUserStats', sinon.fake.returns({ value: 1 }));
			sinon.replace(LdapConfigService, 'generateClassStats', sinon.fake.returns({ value: 2 }));
			const result = await instance.verifyConfig({
				providerOptions: {
					classPathAdditions: 'ou=classes',
				},
			});
			expect(result.ok).to.equal(true);
			expect(LdapConfigService.generateUserStats.calledWith([1, 2])).to.equal(true);
			expect(LdapConfigService.generateClassStats.calledWith([3, 4])).to.equal(true);
			expect(result.users.value).to.equal(1);
			expect(result.classes.value).to.equal(2);
		});
	});

	describe('#constructSystem', () => {
		it('should return a system based on the given config', () => {
			const config = {
				provider: 'general',
				providerOptions: { foo: 'bar' },
			};
			const schoolName = 'HPI Potsdam';
			const system = LdapConfigService.constructSystem(config, { name: schoolName }, true);
			expect(system.type).to.equal('ldap');
			expect(system.alias).to.equal(schoolName);
			expect(system.ldapConfig.providerOptions.schoolName).to.equal(schoolName);
			expect(system.ldapConfig.providerOptions.foo).to.equal('bar');
			expect(system.ldapConfig.active).to.equal(true);
		});

		it('should not activate the system if activate=false', () => {
			const config = {
				provider: 'general',
				providerOptions: { foo: 'bar' },
			};
			const system = LdapConfigService.constructSystem(config, {}, false);
			expect(system.ldapConfig.active).to.equal(false);
		});
	});

	describe('#generateUserStats', () => {
		it('reports the number of users', () => {
			expect(LdapConfigService.generateUserStats([]).total).to.equal(0);
			expect(LdapConfigService.generateUserStats([1, 2, 3]).total).to.equal(3);
		});

		it('reports stats on roles', () => {
			const emptyResult = LdapConfigService.generateUserStats([]);
			expect(emptyResult.admin).to.equal(0);
			expect(emptyResult.teacher).to.equal(0);
			expect(emptyResult.student).to.equal(0);

			const realisticResult = LdapConfigService.generateUserStats([
				{ roles: ['administrator'] },
				{ roles: ['teacher'] },
				{ roles: ['teacher'] },
				{ roles: ['teacher', 'administrator'] },
				{ roles: ['student'] },
				{ roles: ['student'] },
				{ roles: ['student'] },
				{ roles: ['student'] },
			]);
			expect(realisticResult.admin).to.equal(2);
			expect(realisticResult.teacher).to.equal(3);
			expect(realisticResult.student).to.equal(4);
		});

		it('returns a sample entity', () => {
			const entites = [
				{ firstName: 'Ralf', roles: ['teacher'] },
				{ firstName: 'Gundula', roles: ['administrator'] },
				{ firstName: 'Boris', roles: ['student'] },
			];
			const result = LdapConfigService.generateUserStats(entites);
			expect(entites).to.include(result.sample);
		});
	});

	describe('#generateClassStats', () => {
		it('reports the number of classes', () => {
			expect(LdapConfigService.generateClassStats([]).total).to.equal(0);
			expect(LdapConfigService.generateClassStats([1, 2, 3]).total).to.equal(3);
		});

		it('returns a sample entity', () => {
			const entites = [
				{ description: 'Maulwürfe', uniqueMembers: [] },
				{ description: 'Gummibären', uniqueMembers: [] },
				{ description: 'Tigerenten', uniqueMembers: [] },
			];
			const result = LdapConfigService.generateClassStats(entites);
			expect(entites).to.include(result.sample);
		});
	});

	describe('#shouldVerifyClasses', () => {
		it('should return true if classPathAdditions are not empty nor undefined', () => {
			expect(LdapConfigService.shouldVerifyClasses({})).to.equal(false);
			expect(
				LdapConfigService.shouldVerifyClasses({
					providerOptions: {},
				})
			).to.equal(false);
			expect(
				LdapConfigService.shouldVerifyClasses({
					providerOptions: {
						classPathAdditions: '',
					},
				})
			).to.equal(false);
			expect(
				LdapConfigService.shouldVerifyClasses({
					providerOptions: {
						classPathAdditions: 'ou=classes',
					},
				})
			).to.equal(true);
		});
	});
});
