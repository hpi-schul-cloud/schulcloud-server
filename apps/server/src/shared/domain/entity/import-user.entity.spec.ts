import { importUserFactory, schoolEntityFactory, setupEntities, userFactory } from '@shared/testing/factory';
import { MatchCreator } from '.';

describe('ImportUser entity', () => {
	beforeAll(async () => {
		await setupEntities();
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
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.buildWithId({ school });
			const importUser = importUserFactory.matched(MatchCreator.AUTO, user).buildWithId({ school });
			expect(importUser.user).toEqual(user);
			expect(importUser.matchedBy).toEqual(MatchCreator.AUTO);
			importUser.revokeMatch();
			expect(importUser.user).toBeUndefined();
			expect(importUser.matchedBy).toBeUndefined();
		});

		it('should fail when set a match with a different school', () => {
			const user = userFactory.buildWithId();
			const importUser = importUserFactory.buildWithId();
			expect(() => importUser.setMatch(user, MatchCreator.AUTO)).toThrowError('not same school');
			expect(importUser.user).toBeUndefined();
			expect(importUser.matchedBy).toBeUndefined();
		});
	});
});
