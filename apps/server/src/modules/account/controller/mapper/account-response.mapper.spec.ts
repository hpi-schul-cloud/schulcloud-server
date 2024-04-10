import { accountDoFactory } from '@shared/testing';
import { Account } from '../../domain';
import { AccountResponseMapper } from './account-response.mapper';
import { ResolvedSearchListAccountDto } from '../../uc/dto/resolved-account.dto';

describe('AccountResponseMapper', () => {
	describe('mapToAccountResponse', () => {
		describe('When mapping Account to AccountResponse', () => {
			const setup = () => {
				const testDto: Account = accountDoFactory.build();
				return testDto;
			};

			it('should map all fields', () => {
				const testDto = setup();

				const ret = AccountResponseMapper.mapToAccountResponse(testDto);

				expect(ret.id).toBe(testDto.id);
				expect(ret.userId).toBe(testDto.userId?.toString());
				expect(ret.activated).toBe(testDto.activated);
				expect(ret.username).toBe(testDto.username);
			});
		});
	});

	describe('mapToAccountResponses', () => {
		describe('When mapping Account[] to AccountResponse[]', () => {
			const setup = () => {
				const testDto: Account[] = accountDoFactory.buildList(3);
				return testDto;
			};

			it('should map all fields', () => {
				const testDto = setup();

				const ret = AccountResponseMapper.mapToAccountResponses(testDto);

				expect(ret.length).toBe(testDto.length);
				expect(ret[0].id).toBe(testDto[0].id);
				expect(ret[0].userId).toBe(testDto[0].userId?.toString());
				expect(ret[0].activated).toBe(testDto[0].activated);
				expect(ret[0].username).toBe(testDto[0].username);
			});
		});
	});

	describe('mapToAccountSearchListResponse', () => {
		describe('When mapping ResolvedSearchListAccountDto to AccountSearchListResponse', () => {
			const setup = () => {
				const testDto = accountDoFactory.build();
				const searchListDto = new ResolvedSearchListAccountDto([testDto], 1, 0, 1);
				return searchListDto;
			};

			it('should map all fields', () => {
				const searchListDto = setup();

				const ret = AccountResponseMapper.mapToAccountSearchListResponse(searchListDto);

				expect(ret.data.length).toBe(searchListDto.data.length);
				expect(ret.data[0].id).toBe(searchListDto.data[0].id);
				expect(ret.data[0].userId).toBe(searchListDto.data[0].userId?.toString());
				expect(ret.data[0].activated).toBe(searchListDto.data[0].activated);
				expect(ret.data[0].username).toBe(searchListDto.data[0].username);
				expect(ret.total).toBe(searchListDto.total);
				expect(ret.skip).toBe(searchListDto.skip);
				expect(ret.limit).toBe(searchListDto.limit);
			});
		});
	});
});
