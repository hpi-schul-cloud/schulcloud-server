import { Test, TestingModule } from '@nestjs/testing';
import { IAccount } from '@shared/domain';
import { AccountDto } from '../services/dto';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper.abstract';
import { AccountIdmToDtoMapperIdm } from './account-idm-to-dto.mapper.idm';

describe('AccountIdmToDtoMapperIdm', () => {
	let module: TestingModule;
	let mapper: AccountIdmToDtoMapper;

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

			expect(ret.username).toBe('');
		});
	});
});
