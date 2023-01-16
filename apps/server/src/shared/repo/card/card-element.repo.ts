import { Injectable } from '@nestjs/common';
import { CardElement, CompletionDateCardElement, RichTextCardElement, TitleCardElement } from '@shared/domain';
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

@Injectable()
export class RichTextCardElementRepo extends BaseRepo<RichTextCardElement> {
	get entityName() {
		return RichTextCardElement;
	}
}

@Injectable()
export class CompletionDateCardElementRepo extends BaseRepo<CompletionDateCardElement> {
	get entityName() {
		return CompletionDateCardElement;
	}
}
