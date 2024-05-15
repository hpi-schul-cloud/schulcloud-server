import { Counted } from '@shared/domain/types';
import { accountDoFactory } from '@shared/testing';
import { Account } from '../../domain/account';
import { AccountUcMapper } from './account-uc.mapper';

describe('AccountUcMapper', () => {
	describe('mapToResolvedAccountDto', () => {
		describe('When mapping Account to ResolvedAccountDto', () => {
			const setup = () => {
				const testDos: Account = accountDoFactory.build();
				return testDos;
			};

			it('should map all fields', () => {
				const testDos = setup();

				const ret = AccountUcMapper.mapToResolvedAccountDto(testDos);

				expect(ret.id).toBe(testDos.id);
				expect(ret.userId).toBe(testDos.userId?.toString());
				expect(ret.activated).toBe(testDos.activated);
				expect(ret.username).toBe(testDos.username);
			});
		});
	});

	describe('mapSearchResult', () => {
		describe('When mapping Counted<Account[]> to Counted<ResolvedAccountDto[]>', () => {
			const setup = () => {
				const testDos: Counted<Account[]> = [accountDoFactory.buildList(3), 3];
				return testDos;
			};

			it('should map all fields', () => {
				const testDos = setup();

				const ret = AccountUcMapper.mapSearchResult(testDos);

				expect(ret[0].length).toBe(testDos[0].length);
				expect(ret[0][0].id).toBe(testDos[0][0].id);
				expect(ret[0][0].userId).toBe(testDos[0][0].userId?.toString());
				expect(ret[0][0].activated).toBe(testDos[0][0].activated);
				expect(ret[0][0].username).toBe(testDos[0][0].username);
			});
		});
	});

	describe('mapAccountsToDo', () => {
		describe('When mapping Account[] to ResolvedAccountDto[]', () => {
			const setup = () => {
				const testDos: Account[] = accountDoFactory.buildList(3);
				return testDos;
			};

			it('should map all fields', () => {
				const testDos = setup();

				const ret = AccountUcMapper.mapAccountsToDo(testDos);

				expect(ret.length).toBe(testDos.length);
				expect(ret[0].id).toBe(testDos[0].id);
				expect(ret[0].userId).toBe(testDos[0].userId?.toString());
				expect(ret[0].activated).toBe(testDos[0].activated);
				expect(ret[0].username).toBe(testDos[0].username);
			});
		});
	});
});
