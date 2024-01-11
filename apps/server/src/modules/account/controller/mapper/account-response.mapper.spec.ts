import { accountDtoFactory } from '@shared/testing';
import { Account } from '../../domain';
import { AccountResponseMapper } from './account-response.mapper';

describe('AccountResponseMapper', () => {
	describe('mapToResponse', () => {
		describe('When mapping Account to AccountResponse', () => {
			const setup = () => {
				const testDto: Account = accountDtoFactory.buildWithId();
				return testDto;
			};

			it('should map all fields', () => {
				const testDto = setup();

				const ret = AccountResponseMapper.mapToResponse(testDto);

				expect(ret.id).toBe(testDto.id);
				expect(ret.userId).toBe(testDto.userId?.toString());
				expect(ret.activated).toBe(testDto.activated);
				expect(ret.username).toBe(testDto.username);
			});
		});
	});
});
