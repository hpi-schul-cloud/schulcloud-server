import { Injectable } from '@nestjs/common';
import { CardElement, TitleCardElement } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class CardElementRepo extends BaseRepo<CardElement> {
	get entityName() {
		return CardElement;
	}
}
@Injectable()
export class TitleCardElementRepo extends BaseRepo<TitleCardElement> {
	get entityName() {
		return TitleCardElement;
	}
}

export class RichTextCardElementRepo extends CardElementRepo {}
