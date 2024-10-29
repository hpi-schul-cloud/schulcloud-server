import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { extractJwtFromHeader } from '@shared/common';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
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
		const jwt = extractJwtFromHeader(this.request) ?? this.request.headers.authorization;

		if (!jwt) {
			throw new UnauthorizedException('No JWT found in request');
		}

		return jwt;
	}
}
