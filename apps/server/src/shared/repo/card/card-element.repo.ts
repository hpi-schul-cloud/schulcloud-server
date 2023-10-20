import { Injectable } from '@nestjs/common';
import { CardElement, RichTextCardElement } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class CardElementRepo extends BaseRepo<CardElement> {
	get entityName() {
		return CardElement;
	}
}

@Injectable()
export class RichTextCardElementRepo extends BaseRepo<RichTextCardElement> {
	get entityName() {
		return RichTextCardElement;
	}
}
