import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Lti11Service } from '@src/modules/tool/service/lti11.service';
import { PseudonymsRepo } from '@shared/repo';
import OAuth from 'oauth-1.0a';
import { LtiPrivacyPermission, PseudonymDO } from '@shared/domain';
import CryptoJS from 'crypto-js';

describe('Lti11Service', () => {
	let module: TestingModule;
	let service: Lti11Service;

	let pseudonymRepo: DeepMocked<PseudonymsRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Lti11Service,
				{
					provide: PseudonymsRepo,
					useValue: createMock<PseudonymsRepo>(),
				},
			],
		}).compile();

		service = module.get(Lti11Service);
		pseudonymRepo = module.get(PseudonymsRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('createConsumer', () => {
		it('should return Oauth1 encryption consumer', () => {
			const ltiKey = 'key';
			const ltiSecret = 'secret';

			const result: OAuth = service.createConsumer(ltiKey, ltiSecret);

			expect(result).toEqual(
				expect.objectContaining({
					consumer: {
						key: ltiKey,
						secret: ltiSecret,
					},
					signature_method: 'HMAC-SHA1',
				})
			);
		});

		it('should return correct Oauth1 hash', () => {
			const ltiKey = 'key';
			const testString = 'test';
			const wordArray: DeepMocked<CryptoJS.lib.WordArray> = createMock<CryptoJS.lib.WordArray>();

			wordArray.toString.mockReturnValue('mockEncryptedValue');
			jest.spyOn(CryptoJS, 'HmacSHA1').mockReturnValue(wordArray);

			const consumer: OAuth = service.createConsumer(ltiKey, 'secret');
			const result: string = consumer.hash_function(testString, ltiKey);

			expect(result).toEqual('mockEncryptedValue');
		});
	});

	describe('getUserName', () => {
		it('should return pseudonym when privacy_permission is pseudonym', async () => {
			const pseudonymDO: PseudonymDO = new PseudonymDO({
				userId: 'userId',
				toolId: 'toolId',
				pseudonym: 'mockPseudonym',
			});
			pseudonymRepo.findByUserIdAndToolId.mockResolvedValue(pseudonymDO);

			const result: string = await service.getUserIdOrPseudonym(
				pseudonymDO.userId,
				pseudonymDO.toolId,
				LtiPrivacyPermission.PSEUDONYMOUS
			);

			expect(result).toEqual(pseudonymDO.pseudonym);
		});

		it('should return user id when privacy_permission is name', async () => {
			const userId = 'userId';

			const result: string = await service.getUserIdOrPseudonym(userId, 'toolId', LtiPrivacyPermission.NAME);

			expect(result).toEqual(userId);
		});

		it('should return user id when privacy_permission is e-mail', async () => {
			const userId = 'userId';

			const result: string = await service.getUserIdOrPseudonym(userId, 'toolId', LtiPrivacyPermission.EMAIL);

			expect(result).toEqual(userId);
		});
	});
});
