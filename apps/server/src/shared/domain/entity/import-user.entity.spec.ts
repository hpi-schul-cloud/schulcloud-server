import { MikroORM } from '@mikro-orm/core';
import { importUserFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { MatchCreator } from '.';

describe('ImportUser entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('When ldapDN is given', () => {
		it('should extract loginName from ldapDN', () => {
			const importUser = importUserFactory.build({
				ldapDn: `uid=johnDoe123,cn=schueler,cn=users,ou=1,dc=training,dc=ucs`,
			});
			const { loginName } = importUser;
			expect(loginName).toEqual('johnDoe123');
		});
	});

	describe('When ldapDN is not given', () => {
		it('should extract null as loginName ', () => {
			const importUser = importUserFactory.build({
				ldapDn: 'not_matching_our_pattern',
			});
			const { loginName } = importUser;
			expect(loginName).toBeNull();
		});
	});

	describe('constructor', () => {
		it('should set classNames iff defined', () => {
			const importUser = importUserFactory.build({ classNames: ['a class name'] });
			expect(importUser.classNames).toHaveLength(1);
		});
		it('should set flagged iff true', () => {
			const importUser = importUserFactory.build({ flagged: true });
			expect(importUser.flagged).toEqual(true);
		});
		it('should not set flagged iff false', () => {
			const importUser = importUserFactory.build({ flagged: false });
			expect(importUser.flagged).not.toEqual(true);
		});
	});

	describe('match', () => {
		it('should set and unset both, user and matchedBy', () => {
			const school = schoolFactory.build();
			const user = userFactory.build({ school });
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({ school });
			expect(importUser.user).toEqual(user);
			expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
			importUser.revokeMatch();
			expect(importUser.user).toBeUndefined();
			expect(importUser.matchedBy).toBeUndefined();
		});
	});
});
