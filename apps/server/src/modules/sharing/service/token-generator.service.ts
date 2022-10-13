import { Injectable } from '@nestjs/common';
import { ShareTokenString } from '@shared/domain';
import { nanoid } from 'nanoid';

@Injectable()
export class TokenGenerator {
	generateShareToken(): ShareTokenString {
		const token = nanoid(12);
		return token;
	}
}
