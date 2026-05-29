import { ValueObject } from '@shared/domain/value-object.decorator';
import { IsUrl } from 'class-validator';

@ValueObject()
export class SignedUrlResponseVo {
	@IsUrl({ require_tld: false })
	public readonly url: string;

	constructor(url: string) {
		this.url = url;
	}
}
