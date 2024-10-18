import { CardResponse } from '../cards-api-client';
import { CardResponseDto } from '../dto/card-response.dto';

export class CardResponseMapper {
	public static mapToCardResponseDto(cardResponse: CardResponse) {
		return new CardResponseDto(
			cardResponse.id,
			cardResponse.title!,
			cardResponse.height,
			cardResponse.elements,
			cardResponse.visibilitySettings,
			cardResponse.timestamps
		);
	}

    private static mapTo
}
