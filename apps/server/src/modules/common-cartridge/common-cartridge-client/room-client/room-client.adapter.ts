import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtExtractor } from '@shared/common/utils';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { RoomBoardDto } from './dto';
import { RoomBoardDtoMapper } from './mapper/room-board-dto.mapper';
import { CourseRoomsApi } from './room-api-client';

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
		return JwtExtractor.extractJwtFromRequestOrFail(this.request);
	}
}
