import { Test, TestingModule } from '@nestjs/testing';
import { IdmAccount } from '@shared/domain';
import { AccountDto } from '../services/dto';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper.abstract';
import { AccountIdmToDtoMapperDb } from './account-idm-to-dto.mapper.db';

describe('AccountIdmToDtoMapperDb', () => {
	let module: TestingModule;
	let mapper: AccountIdmToDtoMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: AccountIdmToDtoMapper,
					useClass: AccountIdmToDtoMapperDb,
				},
			],
		}).compile();

		mapper = module.get(AccountIdmToDtoMapper);
	});

	afterAll(async () => {
		await module.close();
	});
	describe('mapToDto', () => {
		describe('when mapping from entity to dto', () => {
			const setup = () => {
				const testIdmEntity: IdmAccount = {
					id: 'id',
					username: 'username',
					email: 'email',
					firstName: 'firstName',
					lastName: 'lastName',
					createdDate: new Date(),
					attDbcAccountId: 'attDbcAccountId',
					attDbcUserId: 'attDbcUserId',
					attDbcSystemId: 'attDbcSystemId',
				};
				return testIdmEntity;
			};

			it('should map all fields', () => {
				const testIdmEntity = setup();

				const ret = mapper.mapToDto(testIdmEntity);

				expect(ret).toEqual(
					expect.objectContaining<Partial<AccountDto>>({
						id: testIdmEntity.attDbcAccountId,
						idmReferenceId: testIdmEntity.id,
						userId: testIdmEntity.attDbcUserId,
						systemId: testIdmEntity.attDbcSystemId,
						createdAt: testIdmEntity.createdDate,
						updatedAt: testIdmEntity.createdDate,
						username: testIdmEntity.username,
					})
				);
			});
		});

		describe('when date is undefined', () => {
			const setup = () => {
				const testIdmEntity: IdmAccount = {
					id: 'id',
				};
				return testIdmEntity;
			};

			it('should use actual date', () => {
				const testIdmEntity = setup();

				const ret = mapper.mapToDto(testIdmEntity);

				const now = new Date();
				expect(ret.createdAt).toEqual(now);
				expect(ret.updatedAt).toEqual(now);
			});
		});

		describe('when a fields value is missing', () => {
			const setup = () => {
				const testIdmEntity: IdmAccount = {
					id: 'id',
				};
				return testIdmEntity;
			};

			it('should fill with empty string', () => {
				const testIdmEntity = setup();

				const ret = mapper.mapToDto(testIdmEntity);

				expect(ret.id).toBe('');
				expect(ret.username).toBe('');
			});
		});
	});
});
