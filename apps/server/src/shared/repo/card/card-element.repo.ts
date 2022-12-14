import { Injectable } from '@nestjs/common';
import { CardElement } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class CardElementRepo extends BaseRepo<CardElement> {
	get entityName() {
		return CardElement;
	}
}

export class TitleCardElementRepo extends CardElementRepo {}

export class RichTextCardElementRepo extends CardElementRepo {}
