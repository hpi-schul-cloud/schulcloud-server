import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { BoardCardApi } from './cards-api-client';
import { CardListResponseDto } from './dto/card-list-response.dto';
import { CardResponseMapper } from './mapper/card-response.mapper';

@Injectable()
export class CardClientAdapter {
	constructor(private readonly boardCardApi: BoardCardApi, @Inject(REQUEST) private request: Request) {}

	public async getAllBoardCardsByIds(cardsIds: string[]): Promise<CardListResponseDto> {
		const options = this.createOptionParams();
		const getBoardCardsResponse = await this.boardCardApi
			.cardControllerGetCards(cardsIds, options)
			.then((response) => response.data);

		return CardResponseMapper.mapToCardListResponseDto(getBoardCardsResponse);
	}

	private createOptionParams(): RawAxiosRequestConfig {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		return JwtExtractor.extractJwtFromRequestOrFail(this.request);
	}
}
