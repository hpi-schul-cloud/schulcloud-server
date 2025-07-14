import { ObjectId } from 'bson';
import { customJwtPayloadFactory } from '../../testing';
import { CustomJwtPayload } from './custom-jwt-payload.vo';

describe('CustomJwtPayload', () => {
	describe('constructor', () => {
		afterEach(() => {
			jest.resetAllMocks();
		});

		describe('when valid props are provided', () => {
			it('should assign accountId and jti', () => {
				const customJwtPayloadProps = customJwtPayloadFactory.build();

				const payload = new CustomJwtPayload(customJwtPayloadProps);

				expect(payload.accountId).toBe(customJwtPayloadProps.accountId);
				expect(payload.jti).toBe(customJwtPayloadProps.jti);
			});
		});

		describe('when accountId is missing', () => {
			const setup = () => {
				const props = { jti: 'jwt-id-123' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new CustomJwtPayload(props)).toThrow();
			});
		});

		describe('when jti is missing', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const props = { accountId };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new CustomJwtPayload(props)).toThrow();
			});
		});

		describe('when accountId is not a valid MongoId', () => {
			const setup = () => {
				const props = { accountId: 'not-a-mongoid', jti: 'jwt-id-123' };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new CustomJwtPayload(props)).toThrow();
			});
		});

		describe('when jti is not a string', () => {
			const setup = () => {
				const accountId = new ObjectId().toHexString();
				const props = { accountId, jti: 123 };

				return { props };
			};

			it('should throw', () => {
				const { props } = setup();

				expect(() => new CustomJwtPayload(props)).toThrow();
			});
		});
	});
});
