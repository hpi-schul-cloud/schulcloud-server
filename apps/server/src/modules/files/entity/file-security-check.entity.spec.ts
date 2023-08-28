import { validate as validateUUID } from 'uuid';
import { FileSecurityCheckStatus } from '../domain';
import { FileSecurityCheckEntity } from './file-security-check.entity';

describe(FileSecurityCheckEntity.name, () => {
	describe('constructor', () => {
		describe('should set proper fields values', () => {
			const verifyTimestamps = (entity: FileSecurityCheckEntity) => {
				const currentTime = new Date().getTime();

				const createdAtTime = entity.createdAt.getTime();

				expect(createdAtTime).toBeGreaterThan(0);
				expect(createdAtTime).toBeLessThanOrEqual(currentTime);

				const updatedAtTime = entity.updatedAt.getTime();

				expect(updatedAtTime).toBeGreaterThan(0);
				expect(updatedAtTime).toBeLessThanOrEqual(currentTime);
			};

			it('for an empty props object', () => {
				const entity = new FileSecurityCheckEntity({});

				verifyTimestamps(entity);
				expect(entity).toEqual(
					expect.objectContaining({
						status: FileSecurityCheckStatus.PENDING,
						reason: 'not yet scanned',
					})
				);
				expect(entity.requestToken).toBeDefined();
				expect(entity.requestToken?.length).toBeGreaterThan(0);
				expect(validateUUID(entity.requestToken as string)).toEqual(true);
			});

			it('from the provided complete props object', () => {
				const status = FileSecurityCheckStatus.VERIFIED;
				const reason = 'AV scanning done';
				const requestToken = 'b9ebf8d9-6029-4d6c-bd93-4cace483df3c';

				const entity = new FileSecurityCheckEntity({
					status,
					reason,
					requestToken,
				});

				verifyTimestamps(entity);
				expect(entity).toEqual(
					expect.objectContaining({
						status,
						reason,
					})
				);
				expect(entity.requestToken).toEqual(requestToken);
			});
		});
	});
});
