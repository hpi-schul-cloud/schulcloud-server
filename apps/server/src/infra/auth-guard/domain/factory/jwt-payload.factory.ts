import jwt from 'jsonwebtoken';
import { JwtPayload } from '../vo';

export class JwtPayloadVoFactory {
	public static build(token: string): JwtPayload {
		const decodedJwt = jwt.decode(token, { json: true });
		const jwtPayloadProps = decodedJwt as JwtPayload;
		const jwtPayload = new JwtPayload(jwtPayloadProps);

		return jwtPayload;
	}
}
