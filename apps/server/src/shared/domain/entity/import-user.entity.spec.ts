import { MikroORM, wrap } from '@mikro-orm/core';
import { importUserFactory, setupEntities, userFactory } from '@shared/testing';
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

	describe('getters', () => {
		it('get matchedBy should return property value _matchedBy', () => {
			const user = userFactory.build();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build();
			expect(importUser.matchedBy).toEqual(importUser._matchedBy);
			expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
		});
		it('get user should return property value _user', () => {
			const user = userFactory.build();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build();
			expect(importUser.user).toEqual(importUser._user);
			expect(importUser.user).toEqual(wrap(user).toReference());
		});
	});

	describe('revokeMatch', () => {
		it('should unset both, _user and _matchedBy', () => {
			const user = userFactory.build();
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build();
			expect(importUser.user).toEqual(wrap(user).toReference());
			expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
			importUser.revokeMatch();
			expect(importUser.user).toBeUndefined();
			expect(importUser.matchedBy).toBeUndefined();
		});
	});
});
