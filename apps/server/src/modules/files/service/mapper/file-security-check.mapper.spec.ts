import { FileSecurityCheckMapper } from './file-security-check.mapper';
import { FileSecurityCheck, FileSecurityCheckStatus } from '../../domain';
import { FileSecurityCheckEntity } from '../../entity';

describe(FileSecurityCheckMapper.name, () => {
	describe('mapToDO', () => {
		it('should properly map the entity to the domain object', () => {
			const entity = new FileSecurityCheckEntity({
				status: FileSecurityCheckStatus.WONT_CHECK,
				reason: 'invalid file',
				requestToken: '69bfad17-3e0e-453f-824a-3565a1106872',
			});

			const domainObject = FileSecurityCheckMapper.mapToDO(entity);

			const expectedDomainObject = new FileSecurityCheck({
				createdAt: entity.createdAt,
				updatedAt: entity.updatedAt,
				status: entity.status,
				reason: entity.reason,
				requestToken: entity.requestToken,
			});

			expect(domainObject).toEqual(expectedDomainObject);
		});
	});
});
