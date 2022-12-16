import { IAccount } from '@shared/domain';
import { AccountIdmToDtoMapper } from './account-idm-to-dto.mapper';

describe('AccountIdmToDtoMapper', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

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
			const ret = AccountIdmToDtoMapper.mapToDto(testIdmEntity);

			expect(ret.id).toBe(testIdmEntity.attRefTechnicalId);
			expect(ret.idmReferenceId).toBe(testIdmEntity.id);
			expect(ret.userId).toBe(testIdmEntity.attRefFunctionalIntId);
			expect(ret.systemId).toBe(testIdmEntity.attRefFunctionalExtId);
			expect(ret.createdAt).toBe(testIdmEntity.createdDate);
			expect(ret.updatedAt).toBe(testIdmEntity.createdDate);
			expect(ret.username).toBe(testIdmEntity.username);
		});

		it('should use actual date if date is', () => {
			const testIdmEntity: IAccount = {
				id: 'id',
			};
			const ret = AccountIdmToDtoMapper.mapToDto(testIdmEntity);

			const now = new Date();
			expect(ret.createdAt).toEqual(now);
			expect(ret.updatedAt).toEqual(now);
		});

		it('should fill missing fields with empty string', () => {
			const testIdmEntity: IAccount = {
				id: 'id',
			};
			const ret = AccountIdmToDtoMapper.mapToDto(testIdmEntity);

			expect(ret.id).toBe('');
			expect(ret.username).toBe('');
		});
	});
});
