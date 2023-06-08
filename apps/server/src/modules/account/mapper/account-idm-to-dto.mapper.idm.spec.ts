import { Test, TestingModule } from '@nestjs/testing';
import { IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper.abstract';
import { AccountIdmToDtoMapperIdm } from './account-idm-to-dto.mapper.idm';

describe('AccountIdmToDtoMapperIdm', () => {
	let module: TestingModule;
	let mapper: AccountIdmToDtoMapper;

	const now: Date = new Date(2022, 1, 22);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: AccountIdmToDtoMapper,
					useClass: AccountIdmToDtoMapperIdm,
				},
			],
		}).compile();

		mapper = module.get(AccountIdmToDtoMapper);

		jest.useFakeTimers();
		jest.setSystemTime(now);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when mapping from entity to dto', () => {
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
					id: testIdmEntity.id,
					idmReferenceId: undefined,
					userId: testIdmEntity.attRefFunctionalIntId,
					systemId: testIdmEntity.attRefFunctionalExtId,
					createdAt: testIdmEntity.createdDate,
					updatedAt: testIdmEntity.createdDate,
					username: testIdmEntity.username,
				})
			);
		});

		describe('when date is undefined', () => {
			it('should use actual date', () => {
				const testIdmEntity: IAccount = {
					id: 'id',
				};
				const ret = mapper.mapToDto(testIdmEntity);

				expect(ret.createdAt).toEqual(now);
				expect(ret.updatedAt).toEqual(now);
			});
		});

		describe('when a fields value is missing', () => {
			it('should fill with empty string', () => {
				const testIdmEntity: IAccount = {
					id: 'id',
				};
				const ret = mapper.mapToDto(testIdmEntity);

				expect(ret.username).toBe('');
			});
		});
	});
});
