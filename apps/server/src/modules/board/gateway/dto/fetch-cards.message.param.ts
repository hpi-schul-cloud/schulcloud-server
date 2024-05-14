import { IsMongoId } from 'class-validator';

export class FetchCardsMessageParams {
	@IsMongoId({ each: true })
	cardIds!: string[];
}
