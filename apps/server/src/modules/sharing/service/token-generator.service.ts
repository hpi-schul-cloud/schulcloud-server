import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { ShareTokenString } from '../domainobject/share-token.do';

@Injectable()
export class TokenGenerator {
	public generateShareToken(): ShareTokenString {
		const token = nanoid(12);
		return token;
	}
}
