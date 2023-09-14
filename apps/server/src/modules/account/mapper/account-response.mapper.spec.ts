import { Account } from '@shared/domain';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { accountDtoFactory, accountFactory } from '@shared/testing';
import { AccountResponseMapper } from '.';

describe('AccountResponseMapper', () => {
	describe('mapToResponseFromEntity', () => {
		describe('When mapping AccountEntity to AccountResponse', () => {
			const setup = () => {
				const testEntityAllFields: Account = accountFactory.withAllProperties().buildWithId();

				const testEntityMissingUserId: Account = accountFactory.withoutSystemAndUserId().build();

				return { testEntityAllFields, testEntityMissingUserId };
			};

			it('should map all fields', () => {
				const { testEntityAllFields } = setup();

				const ret = AccountResponseMapper.mapToResponseFromEntity(testEntityAllFields);

				expect(ret.id).toBe(testEntityAllFields.id);
				expect(ret.userId).toBe(testEntityAllFields.userId?.toString());
				expect(ret.activated).toBe(testEntityAllFields.activated);
				expect(ret.username).toBe(testEntityAllFields.username);
			});

			it('should ignore missing userId', () => {
				const { testEntityMissingUserId } = setup();

				const ret = AccountResponseMapper.mapToResponseFromEntity(testEntityMissingUserId);

				expect(ret.userId).toBeUndefined();
			});
		});
	});

	describe('mapToResponse', () => {
		describe('When mapping AccountDto to AccountResponse', () => {
			const setup = () => {
				const testDto: AccountDto = accountDtoFactory.buildWithId();
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
