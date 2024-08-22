import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { extractJwtFromHeader } from '@shared/common';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { BoardApi } from './board-api-client';
import { BoardSkeletonDtoMapper } from '../mapper';
import { BoardSkeletonDto } from '../dto';

@Injectable()
export class BoardClientAdapter {
	constructor(private readonly boardApi: BoardApi, @Inject(REQUEST) private request: Request) {}

	public async getBoard(boardId: string): Promise<BoardSkeletonDto> {
		const options = this.createOptionParams();
		const boardResponse = await this.boardApi
			.boardControllerGetBoardSkeleton(boardId, options)
			.then((response) => response.data);

		const boardSkeletonDto = BoardSkeletonDtoMapper.mapToBoardSkeletonDto(boardResponse);

		return boardSkeletonDto;
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
