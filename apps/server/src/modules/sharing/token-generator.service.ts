import { Injectable } from '@nestjs/common';
import { ShareToken } from '@shared/domain';
import { nanoid } from 'nanoid';

@Injectable()
export class TokenGenerator {
	generateShareToken(): ShareToken {
		const token = nanoid(12);
		return token;
	}
}
