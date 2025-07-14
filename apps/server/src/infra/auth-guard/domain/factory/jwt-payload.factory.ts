import jwt from 'jsonwebtoken';
import { JwtPayload } from '../vo';

export class JwtPayloadVoFactory {
	public static build(token: string): JwtPayload {
		const decodedJwt = jwt.decode(token, { json: true });

		return new JwtPayload(decodedJwt);
	}
}
