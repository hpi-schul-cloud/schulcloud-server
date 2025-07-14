import jwt from 'jsonwebtoken';

export const decodeJwt = (token: string): unknown => {
	const result = jwt.decode(token, { json: true });

	return result;
};
