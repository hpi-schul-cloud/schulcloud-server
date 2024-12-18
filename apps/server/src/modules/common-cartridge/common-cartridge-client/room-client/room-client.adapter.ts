import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { extractJwtFromHeader } from '@shared/common';
import { RawAxiosRequestConfig } from 'axios';
import { CourseRoomsApi } from './room-api-client';
import { RoomBoardDto } from './dto';
import { RoomBoardDtoMapper } from './mapper/room-board-dto.mapper';

@Injectable()
export class CourseRoomsClientAdapter {
	constructor(private readonly courseRoomsApi: CourseRoomsApi, @Inject(REQUEST) private request: Request) {}

	public async getRoomBoardByCourseId(roomId: string): Promise<RoomBoardDto> {
		const options = this.createOptionParams();
		const response = await this.courseRoomsApi.courseRoomsControllerGetRoomBoard(roomId, options);

		return RoomBoardDtoMapper.mapResponseToRoomBoardDto(response.data);
	}

	private createOptionParams(): RawAxiosRequestConfig {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		const jwt = extractJwtFromHeader(this.request) || this.request.headers.authorization;

		if (!jwt) {
			throw new UnauthorizedException('Authentication is required.');
		}

		return jwt;
	}
}
