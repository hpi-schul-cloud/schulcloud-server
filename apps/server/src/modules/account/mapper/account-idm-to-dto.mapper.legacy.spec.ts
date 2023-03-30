import { Test, TestingModule } from '@nestjs/testing';
import { IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper.abstract';
import { AccountIdmToDtoMapperLegacy } from './account-idm-to-dto.mapper.legacy';

describe('AccountIdmToDtoMapperLegacy', () => {
	let module: TestingModule;
	let mapper: AccountIdmToDtoMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: AccountIdmToDtoMapper,
					useClass: AccountIdmToDtoMapperLegacy,
				},
			],
		}).compile();

		mapper = module.get(AccountIdmToDtoMapper);
	});

	afterAll(async () => {
		await module.close();
	});
	describe('when mapping from entity to dto', () => {
		describe('mapToDto', () => {
			it('should map all fields', () => {
				const testIdmEntity: IAccount = {
					id: 'id',
					username: 'username',
					email: 'email',
					firstName: 'firstName',
					lastName: 'lastName',
					createdDate: new Date(),
					attRefTechnicalId: 'attRefTechnicalId',
					attRefFunctionalIntId: 'attRefFunctionalIntId',
					attRefFunctionalExtId: 'attRefFunctionalExtId',
				};
				const ret = mapper.mapToDto(testIdmEntity);

				expect(ret).toEqual(
					expect.objectContaining<Partial<AccountDto>>({
						id: testIdmEntity.attRefTechnicalId,
						idmReferenceId: testIdmEntity.id,
						userId: testIdmEntity.attRefFunctionalIntId,
						systemId: testIdmEntity.attRefFunctionalExtId,
						createdAt: testIdmEntity.createdDate,
						updatedAt: testIdmEntity.createdDate,
						username: testIdmEntity.username,
					})
				);
			});

			it('should use actual date if date is undefined', () => {
				const testIdmEntity: IAccount = {
					id: 'id',
				};
				const ret = mapper.mapToDto(testIdmEntity);

				const now = new Date();
				expect(ret.createdAt).toEqual(now);
				expect(ret.updatedAt).toEqual(now);
			});

			it('should fill missing fields with empty string', () => {
				const testIdmEntity: IAccount = {
					id: 'id',
				};
				const ret = mapper.mapToDto(testIdmEntity);

				expect(ret.id).toBe('');
				expect(ret.username).toBe('');
			});
		});
	});
});
