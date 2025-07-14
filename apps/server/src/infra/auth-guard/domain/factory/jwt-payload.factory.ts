import { JwtPayload } from '../vo';

export class JwtPayloadVoFactory {
	public static build(props: unknown): JwtPayload {
		return new JwtPayload(props);
	}
}
