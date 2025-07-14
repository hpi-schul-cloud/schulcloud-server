import jwt from 'jsonwebtoken';
import { decodeJwt } from './decode-jwt.helper';

jest.mock('jsonwebtoken');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

afterEach(() => {
	jest.resetAllMocks();
});

describe('decodeJwt', () => {
	describe('when jwt.decode returns a value', () => {
		const setup = () => {
			const token = 'test-token';
			const decoded = { foo: 'bar' };

			mockedJwt.decode.mockReturnValueOnce(decoded);

			return {
				token,
				decoded,
			};
		};

		it('should return the decoded value from jwt.decode', () => {
			const { token, decoded } = setup();

			const result = decodeJwt(token);

			expect(result).toEqual(decoded);
			expect(mockedJwt.decode).toHaveBeenCalledWith(token, { json: true });
		});
	});

	describe('when jwt.decode returns null', () => {
		const setup = () => {
			const token = 'test-token';
			mockedJwt.decode.mockReturnValueOnce(null);

			return {
				token,
			};
		};

		it('should return null', () => {
			const { token } = setup();

			const result = decodeJwt(token);

			expect(result).toBeNull();
			expect(mockedJwt.decode).toHaveBeenCalledWith(token, { json: true });
		});
	});
});
