import { MongoMemoryDatabaseModule } from '@infra/database';
import { MikroORM, NotFoundError } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import {
	cleanupCollections,
	createCollections,
	importUserFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
import { ImportUserRoleName, ImportUser, MatchCreator } from '../entity';
import { ImportUserMatchCreatorScope } from '../domain/interface';
import { ImportUserRepo } from './import-user.repo';

describe('ImportUserRepo', () => {
	let module: TestingModule;
	let repo: ImportUserRepo;
	let em: EntityManager;
	let orm: MikroORM;

	const persistedReferences = async () => {
		const school = schoolEntityFactory.build();
		const user = userFactory.build({ school });
		await em.persistAndFlush([school, user]);
		return { user, school };
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [ImportUserRepo],
		}).compile();
		repo = module.get(ImportUserRepo);
		em = module.get(EntityManager);
		orm = module.get(MikroORM);

		await createCollections(em);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});

		it('should implement entityName getter', () => {
			expect(repo.entityName).toBe(ImportUser);
		});
	});

	describe('[findById] find importuser by id', () => {
		it('should find one existing importuser in importUsers', async () => {
			const importUser = importUserFactory.build();
			const otherImportUser = importUserFactory.build();

			await em.persistAndFlush([importUser, otherImportUser]);

			const result = await repo.findById(importUser.id);
			expect(importUser).toBe(result);
			expect(importUser).not.toBe(otherImportUser);
		});
		it('should fail for not existing importuser', async () => {
			const importUser = importUserFactory.build();

			await em.persistAndFlush(importUser);
			const { id } = importUser;
			await em.removeAndFlush(importUser);

			await expect(async () => repo.findById(id)).rejects.toThrowError(NotFoundError);
		});
		it('should fail for invalid id', async () => {
			await expect(async () => repo.findById('foo')).rejects.toThrowError(Error);
		});
	});

	describe('[hasMatch] find import-user by user', () => {
		it('should return import-user if a match is assigned', async () => {
			const { school, user } = await persistedReferences();
			const importUser = importUserFactory.build({ user, matchedBy: MatchCreator.AUTO, school });
			await em.persistAndFlush([importUser]);
			const result = await repo.hasMatch(user);
			expect(result).toBe(importUser);
		});
		it('should return null if no match is assigned', async () => {
			const { user } = await persistedReferences();
			const importUser = importUserFactory.build();
			await em.persistAndFlush([importUser]);
			const result = await repo.hasMatch(user);
			expect(result).toBeNull();
		});
		it('should throw error for wrong id given', async () => {
			await persistedReferences();
			const importUser = importUserFactory.build();
			await em.persistAndFlush([importUser]);
			await expect(async () => repo.hasMatch({} as unknown as User)).rejects.toThrowError('invalid user match id');
		});
	});

	describe('[findImportUsers] find importUsers scope integration', () => {
		describe('bySchool', () => {
			it('should respond with given schools importUsers', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ school });
				const otherSchoolsImportUser = importUserFactory.build();
				await em.persistAndFlush([school, importUser, otherSchoolsImportUser]);
				const [results, count] = await repo.findImportUsers(school);
				expect(results).toContain(importUser);
				expect(count).toEqual(1);
			});
			it('should not respond with other schools than requested', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ school });
				const otherSchoolsImportUser = importUserFactory.build({ school: schoolEntityFactory.build() });
				await em.persistAndFlush([school, importUser, otherSchoolsImportUser]);
				const [results] = await repo.findImportUsers(school);
				expect(results).not.toContain(otherSchoolsImportUser);
			});
			it('should not respond with any school for wrong id given', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ school });
				const otherSchoolsImportUser = importUserFactory.build();
				await em.persistAndFlush([school, importUser, otherSchoolsImportUser]);
				await expect(async () =>
					repo.findImportUsers({ _id: 'invalid_id' } as unknown as SchoolEntity)
				).rejects.toThrowError('invalid school id');
			});
			it('should not respond with any school for wrong id given', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ school });
				const otherSchoolsImportUser = importUserFactory.build();
				await em.persistAndFlush([school, importUser, otherSchoolsImportUser]);
				await expect(async () => repo.findImportUsers({} as unknown as SchoolEntity)).rejects.toThrowError(
					'invalid school id'
				);
			});
		});

		describe('byFirstName', () => {
			it('should find fully matching firstnames "exact match"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: 'Marie-Luise' });
				expect(results).toContain(importUser);
				expect(results).not.toContain(otherImportUser);
				expect(count).toEqual(1);
			});
			it('should find partially matching firstnames "ignoring case"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Marie', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: 'marie-luise' });
				expect(results).toContain(importUser);
				expect(results).not.toContain(otherImportUser);
				expect(count).toEqual(1);
			});
			it('should find partially matching firstname "starts-with"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Marie', school });
				const otherImportUser2 = importUserFactory.build({ firstName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser, otherImportUser2]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: 'marie' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(results).not.toContain(otherImportUser2);
				expect(count).toEqual(2);
			});
			it('should find partially matching firstname "ends-with"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Luise', school });
				const otherImportUser2 = importUserFactory.build({ firstName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser, otherImportUser2]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: 'luise' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(results).not.toContain(otherImportUser2);
				expect(count).toEqual(2);
			});
			it('should skip firstname filter for undefined values', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: undefined });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(count).toEqual(2);
			});
			it('should skip firstname filter for empty string', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: ' ' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(count).toEqual(2);
			});
			it('should skip special chars from filter', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ firstName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ firstName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { firstName: '<§$%&/()=?!:.#' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(count).toEqual(2);
			});
			it('should keep characters as filter with language letters, numbers, space and minus', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({
					firstName: 'Marie-Luise áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0987654321',
					school,
				});
				const otherImportUser = importUserFactory.build({ firstName: 'Marie-Luise 0987654321', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, {
					firstName: 'marie-luise áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0987654321',
				});
				expect(results).toContain(importUser);
				expect(results).not.toContain(otherImportUser);
				expect(count).toEqual(1);
			});
		});
		describe('byLastName', () => {
			it('should find fully matching lastNames "exact match"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: 'Marie-Luise' });
				expect(results).toContain(importUser);
				expect(results).not.toContain(otherImportUser);
				expect(count).toEqual(1);
			});
			it('should find partially matching lastNames "ignoring case"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Marie', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: 'marie-luise' });
				expect(results).toContain(importUser);
				expect(results).not.toContain(otherImportUser);
				expect(count).toEqual(1);
			});
			it('should find partially matching lastName "starts-with"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Marie', school });
				const otherImportUser2 = importUserFactory.build({ lastName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser, otherImportUser2]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: 'marie' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(results).not.toContain(otherImportUser2);
				expect(count).toEqual(2);
			});
			it('should find partially matching lastName "ends-with"', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Luise', school });
				const otherImportUser2 = importUserFactory.build({ lastName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser, otherImportUser2]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: 'luise' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(results).not.toContain(otherImportUser2);
				expect(count).toEqual(2);
			});
			it('should skip lastName filter for undefined values', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: undefined });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(count).toEqual(2);
			});
			it('should skip lastName filter for empty string', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: ' ' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(count).toEqual(2);
			});
			it('should skip special chars from filter', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ lastName: 'Marie-Luise', school });
				const otherImportUser = importUserFactory.build({ lastName: 'Peter', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, { lastName: '<§$%&/()=?!:.#' });
				expect(results).toContain(importUser);
				expect(results).toContain(otherImportUser);
				expect(count).toEqual(2);
			});
			it('should keep characters as filter with language letters, numbers, space and minus', async () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({
					lastName: 'Marie-Luise áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0987654321',
					school,
				});
				const otherImportUser = importUserFactory.build({ lastName: 'Marie-Luise 0987654321', school });
				await em.persistAndFlush([school, importUser, otherImportUser]);
				const [results, count] = await repo.findImportUsers(importUser.school, {
					lastName: 'marie-luise áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0987654321',
				});
				expect(results).toContain(importUser);
				expect(results).not.toContain(otherImportUser);
				expect(count).toEqual(1);
			});
		});
	});
	describe('byLoginName', () => {
		it('should find fully matching loginNames "exact match"', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			await em.persistAndFlush([school, importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: 'MarieLuise12' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(count).toEqual(1);
		});
		it('should find partially matching loginNames "ignoring case"', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			await em.persistAndFlush([school, importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: 'marieluise12' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(count).toEqual(1);
		});
		it('should find partially matching loginName "starts-with"', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			const otherImportUser2 = importUserFactory.build({
				ldapDn: 'uid=Marie23,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			await em.persistAndFlush([school, importUser, otherImportUser, otherImportUser2]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: 'marie' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(results).toContain(otherImportUser2);
			expect(count).toEqual(2);
		});
		it('should find partially matching loginName "ends-with"', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			const otherImportUser2 = importUserFactory.build({
				ldapDn: 'uid=Luise23,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			await em.persistAndFlush([school, importUser, otherImportUser, otherImportUser2]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: 'luise' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(results).toContain(otherImportUser2);
			expect(count).toEqual(2);
		});
		it('should skip loginName filter for undefined values', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			await em.persistAndFlush([school, importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: undefined });
			expect(results).toContain(importUser);
			expect(results).toContain(otherImportUser);
			expect(count).toEqual(2);
		});
		it('should skip loginName filter for empty string', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			await em.persistAndFlush([school, importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: ' ' });
			expect(results).toContain(importUser);
			expect(results).toContain(otherImportUser);
			expect(count).toEqual(2);
		});
		it('should skip special chars from filter', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=MarieLuise12,cn=schueler,cn=users,ou=1,dc=training,dc=ucs',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Peter,cn=schueler', school });
			await em.persistAndFlush([school, importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { loginName: '<§$%&/()=?!:.#' });
			expect(results).toContain(importUser);
			expect(results).toContain(otherImportUser);
			expect(count).toEqual(2);
		});
		it('should keep characters as filter with language letters, numbers, space and minus', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				ldapDn: 'uid=Marie-Luise áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0987654321,foo',
				school,
			});
			const otherImportUser = importUserFactory.build({ ldapDn: 'uid=Marie-Luise0987654321,foo', school });
			await em.persistAndFlush([school, importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, {
				loginName: 'marie-luise áàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0987654321',
			});
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(count).toEqual(1);
		});
	});

	describe('byRole', () => {
		it('should contain importusers with role name administrator', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				roleNames: [RoleName.ADMINISTRATOR],
				school,
			});
			const otherImportUser = importUserFactory.build({
				roleNames: [RoleName.ADMINISTRATOR, RoleName.TEACHER],
				school,
			});
			const skippedImportUser = importUserFactory.build({ roleNames: [RoleName.STUDENT] });
			const otherSkippedImportUser = importUserFactory.build({ roleNames: [] });
			await em.persistAndFlush([school, importUser, otherImportUser, skippedImportUser, otherSkippedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { role: RoleName.ADMINISTRATOR });
			expect(results).toContain(importUser); // single match
			expect(results).toContain(otherImportUser); //  contains match
			expect(count).toEqual(2); // no other role name or no role name
		});
		it('should contain importusers with role name student', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				roleNames: [RoleName.STUDENT],
				school,
			});
			const otherImportUser = importUserFactory.build({ roleNames: [RoleName.STUDENT, RoleName.TEACHER], school });
			const skippedImportUser = importUserFactory.build({ roleNames: [RoleName.ADMINISTRATOR] });
			const otherSkippedImportUser = importUserFactory.build({ roleNames: [] });
			await em.persistAndFlush([school, importUser, otherImportUser, skippedImportUser, otherSkippedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { role: RoleName.STUDENT });
			expect(results).toContain(importUser); // single match
			expect(results).toContain(otherImportUser); //  contains match
			expect(count).toEqual(2); // no other role name or no role name
		});
		it('should contain importusers with role name teacher', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				roleNames: [RoleName.TEACHER],
				school,
			});
			const otherImportUser = importUserFactory.build({
				roleNames: [RoleName.ADMINISTRATOR, RoleName.TEACHER],
				school,
			});
			const skippedImportUser = importUserFactory.build({ roleNames: [RoleName.STUDENT] });
			const otherSkippedImportUser = importUserFactory.build({ roleNames: [] });
			await em.persistAndFlush([school, importUser, otherImportUser, skippedImportUser, otherSkippedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, { role: RoleName.TEACHER });
			expect(results).toContain(importUser); // single match
			expect(results).toContain(otherImportUser); //  contains match
			expect(count).toEqual(2); // no other role name or no role name
		});
		it('should fail for all other, invalid role names', async () => {
			const school = schoolEntityFactory.build();
			await em.persistAndFlush(school);
			await expect(async () =>
				repo.findImportUsers(school, { role: 'foo' as unknown as ImportUserRoleName })
			).rejects.toThrowError('unexpected role name');
		});
	});
	describe('byClasses', () => {
		it('should skip whitespace as filter', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({ classNames: ['1a'], school });
			const otherImportUser = importUserFactory.build({ classNames: ['2a'], school });
			await em.persistAndFlush([importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(school, { classes: ' ' });
			expect(results).toContain(importUser);
			expect(results).toContain(otherImportUser);
			expect(count).toEqual(2);
		});
		it('should match classes with full match by ignore case', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({ classNames: ['1a'], school });
			const otherImportUser = importUserFactory.build({ classNames: ['2a'], school });
			await em.persistAndFlush([importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(school, { classes: '1a' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(count).toEqual(1);
		});
		it('should match classes with starts-with by ignore case', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({ classNames: ['1a'], school });
			const otherImportUser = importUserFactory.build({ classNames: ['2a'], school });
			await em.persistAndFlush([importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(school, { classes: '1' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(count).toEqual(1);
		});
		it('should match classes with ends-with by ignore case', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({ classNames: ['1a'], school });
			const otherImportUser = importUserFactory.build({ classNames: ['2a'], school });
			await em.persistAndFlush([importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(school, { classes: 'a' });
			expect(results).toContain(importUser);
			expect(results).toContain(otherImportUser);
			expect(count).toEqual(2);
		});
		it('should trim filter value', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({ classNames: ['1a'], school });
			const otherImportUser = importUserFactory.build({ classNames: ['2a'], school });
			await em.persistAndFlush([importUser, otherImportUser]);
			const [results, count] = await repo.findImportUsers(school, { classes: ' 1a ' });
			expect(results).toContain(importUser);
			expect(results).not.toContain(otherImportUser);
			expect(count).toEqual(1);
		});
	});

	describe('byMatches', () => {
		it('should contain importusers with different and no match for no filter', async () => {
			const { user, school } = await persistedReferences();
			const matchedImportUser = importUserFactory.matched(MatchCreator.MANUAL, user).build({
				school,
			});
			const autoMatchedImportUser = importUserFactory.matched(MatchCreator.AUTO, userFactory.build({ school })).build({
				school,
			});
			const unmatchedImportUser = importUserFactory.build({ school });
			await em.persistAndFlush([school, matchedImportUser, autoMatchedImportUser, unmatchedImportUser]);
			const [results] = await repo.findImportUsers(school, {});
			expect(results).toContain(matchedImportUser);
			expect(results).toContain(autoMatchedImportUser);
			expect(results).toContain(unmatchedImportUser);
		});
		it('should contain importusers with manual match by admin only', async () => {
			const { user, school } = await persistedReferences();
			const importUser = importUserFactory.matched(MatchCreator.MANUAL, user).build({
				school,
			});

			const skippedImportUser = importUserFactory.matched(MatchCreator.AUTO, userFactory.build({ school })).build({
				school,
			});
			const otherSkippedImportUser = importUserFactory.build({ school });
			await em.persistAndFlush([school, importUser, skippedImportUser, otherSkippedImportUser]);
			const [results, count] = await repo.findImportUsers(school, { matches: [ImportUserMatchCreatorScope.MANUAL] });
			expect(results).toContain(importUser); // single match
			expect(results).not.toContain(skippedImportUser); // other match
			expect(results).not.toContain(otherSkippedImportUser); // no match
			expect(count).toEqual(1); // no other or no match not in response
		});

		it('should contain importusers with automatic match only', async () => {
			const { user, school } = await persistedReferences();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({
				school,
			});
			const skippedImportUser = importUserFactory.matched(MatchCreator.MANUAL, userFactory.build({ school })).build({
				school,
			});
			const otherSkippedImportUser = importUserFactory.build({ school });
			await em.persistAndFlush([school, importUser, skippedImportUser, otherSkippedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, {
				matches: [ImportUserMatchCreatorScope.AUTO],
			});
			expect(results).toContain(importUser); // single match
			expect(results).not.toContain(skippedImportUser); // other match
			expect(results).not.toContain(otherSkippedImportUser); // no match
			expect(count).toEqual(1); // no other or no match not in response
		});
		it('should contain importusers with automatic and manual match', async () => {
			const { user, school } = await persistedReferences();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({
				school,
			});
			const otherImportUser = importUserFactory.matched(MatchCreator.MANUAL, userFactory.build({ school })).build({
				school,
			});
			const otherSkippedImportUser = importUserFactory.build({ school });
			await em.persistAndFlush([school, importUser, otherImportUser, otherSkippedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, {
				matches: [ImportUserMatchCreatorScope.AUTO, ImportUserMatchCreatorScope.MANUAL],
			});
			expect(results).toContain(importUser); // manual match
			expect(results).toContain(otherImportUser); // auto match
			expect(results).not.toContain(otherSkippedImportUser); // no match
			expect(count).toEqual(2); // no other or no match not in response
		});
		it('should contain importusers with no match only', async () => {
			const { user, school } = await persistedReferences();
			const importUser = importUserFactory.build({
				school,
			});
			const matchedImportUser = importUserFactory.matched(MatchCreator.AUTO, user).build({
				school,
			});
			const otherMatchedImportUser = importUserFactory
				.matched(MatchCreator.MANUAL, userFactory.build({ school }))
				.build({ school });
			await em.persistAndFlush([school, importUser, matchedImportUser, otherMatchedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, {
				matches: [ImportUserMatchCreatorScope.NONE],
			});
			expect(results).toContain(importUser); // no match
			expect(results).not.toContain(matchedImportUser); // auto match
			expect(results).not.toContain(otherMatchedImportUser); // manual match
			expect(count).toEqual(1); // no other matched importuser in response
		});
		it('should contain importusers for none and with matches same time', async () => {
			const { user, school } = await persistedReferences();
			const importUser = importUserFactory.build({
				school,
			});
			const matchedImportUser = importUserFactory.matched(MatchCreator.AUTO, user).build({
				school,
			});
			const otherMatchedImportUser = importUserFactory
				.matched(MatchCreator.MANUAL, userFactory.build({ school }))
				.build({ school });
			await em.persistAndFlush([school, importUser, matchedImportUser, otherMatchedImportUser]);
			const [results, count] = await repo.findImportUsers(importUser.school, {
				matches: [
					ImportUserMatchCreatorScope.NONE,
					ImportUserMatchCreatorScope.AUTO,
					ImportUserMatchCreatorScope.MANUAL,
				],
			});
			expect(results).toContain(importUser); // no match
			expect(results).toContain(matchedImportUser); // auto match
			expect(results).toContain(otherMatchedImportUser); // manual match
			expect(count).toEqual(3); // like without filter
		});
		it('should skip all other, invalid match names', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({ school });
			await em.persistAndFlush([school, importUser]);
			const [results] = await repo.findImportUsers(school, {
				matches: ['foo'] as unknown as [ImportUserMatchCreatorScope],
			});
			expect(results).toContain(importUser);
		});
	});

	describe('isFlagged', () => {
		it('should respond with and without flagged importusers by default', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				school,
			});
			const flaggedImportUser = importUserFactory.build({
				school,
				flagged: true,
			});
			await em.persistAndFlush([school, importUser, flaggedImportUser]);
			const [results] = await repo.findImportUsers(school, {});
			expect(results).toContain(importUser);
			expect(results).toContain(flaggedImportUser);
		});
		it('should respond with  flagged importusers only', async () => {
			const school = schoolEntityFactory.build();
			const importUser = importUserFactory.build({
				school,
			});
			const flaggedImportUser = importUserFactory.build({
				school,
				flagged: true,
			});
			await em.persistAndFlush([school, importUser, flaggedImportUser]);
			const [results] = await repo.findImportUsers(school, { flagged: true });
			expect(results).not.toContain(importUser);
			expect(results).toContain(flaggedImportUser);
		});
	});

	describe('options: limit and offset', () => {
		it('should apply limit', async () => {
			const school = schoolEntityFactory.build();
			const importUsers = importUserFactory.buildList(10, { school });
			await em.persistAndFlush(importUsers);
			const [results, count] = await repo.findImportUsers(school, {}, { pagination: { limit: 3 } });
			expect(results.length).toEqual(3);
			expect(count).toEqual(10);
			const [results1, count1] = await repo.findImportUsers(school, {}, { pagination: { limit: 5 } });
			expect(results1.length).toEqual(5);
			expect(count1).toEqual(10);
			const [results2, count2] = await repo.findImportUsers(school, {}, {});
			expect(results2.length).toEqual(10);
			expect(count2).toEqual(10);
		});
		it('should apply offset', async () => {
			const school = schoolEntityFactory.build();
			const importUsers = importUserFactory.buildList(10, { school });
			await em.persistAndFlush(importUsers);
			const [results, count] = await repo.findImportUsers(school, {}, { pagination: { skip: 3 } });
			expect(results.length).toEqual(7);
			expect(count).toEqual(10);
			const [results1, count1] = await repo.findImportUsers(school, {}, { pagination: { limit: 5 } });
			expect(results1.length).toEqual(5);
			expect(count1).toEqual(10);
			const [results2, count2] = await repo.findImportUsers(school, {}, {});
			expect(results2.length).toEqual(10);
			expect(count2).toEqual(10);
		});
	});

	describe('Indexes', () => {
		beforeAll(async () => {
			await em.getDriver().ensureIndexes();
		});
		describe('on user (match_userId)', () => {
			it('[SPARSE] should allow to unset items (acceppt null or undefined multiple times)', async () => {
				const school = schoolEntityFactory.build();
				await em.persistAndFlush(school);
				const users = userFactory.buildList(10, { school });
				await em.persistAndFlush(users);
				const importUsers = importUserFactory.buildList(10, {
					school,
				});
				// eslint-disable-next-line no-restricted-syntax
				for (const [i, importuser] of importUsers.entries()) {
					importuser.setMatch(users[i], MatchCreator.AUTO);
				}
				await em.persistAndFlush(importUsers);
				em.clear();
				const [reloadedImportUsers] = await repo.findImportUsers(school);
				const result = reloadedImportUsers.map(async (importuser) => {
					expect(importuser.user).toBeDefined();
					expect(importuser.matchedBy).toBeDefined();
					importuser.revokeMatch();
					await em.persistAndFlush(importuser);
				});
				await Promise.all(result);
			});
			it('[UNIQUE] should prohibit same match of one user ', async () => {
				await orm.getSchemaGenerator().ensureIndexes();
				const school = schoolEntityFactory.build();
				await em.persistAndFlush(school);
				const user = userFactory.build({ school });
				await em.persistAndFlush(user);
				const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({ school });
				await em.persistAndFlush(importUser);
				const importUserWithSameMatch = importUserFactory.matched(MatchCreator.AUTO, user).build({ school });

				await expect(async () => em.persistAndFlush(importUserWithSameMatch)).rejects.toThrowError(
					'duplicate key error'
				);
			});
		});
	});

	describe('saveImportUsers', () => {
		describe('with existing importusers', () => {
			const setup = () => {
				const school = schoolEntityFactory.build();
				const importUser = importUserFactory.build({ school });
				const otherImportUser = importUserFactory.build({ school });

				return { importUser, otherImportUser };
			};

			it('should persist importUsers', async () => {
				const { importUser, otherImportUser } = setup();

				await repo.saveImportUsers([importUser, otherImportUser]);

				await expect(em.findAndCount(ImportUser, {})).resolves.toEqual([[importUser, otherImportUser], 2]);
			});
		});
	});
});
