import { Injectable } from '@nestjs/common';
import { RawAxiosRequestConfig } from 'axios';
import { CourseRoomsApi, SingleColumnBoardResponse } from '../generated';

@Injectable()
export class CourseRoomsClientAdapter {
	constructor(private readonly courseRoomsApi: CourseRoomsApi) {}

	public async getRoomBoardByCourseId(jwt: string, roomId: string): Promise<SingleColumnBoardResponse> {
		const response = await this.courseRoomsApi.courseRoomsControllerGetRoomBoard(roomId, this.getAxiosConfig(jwt));

		return response.data;
	}

	private getAxiosConfig(jwt: string): RawAxiosRequestConfig {
		return {
			headers: {
				Authorization: `Bearer ${jwt}`,
			},
		};
	}
}
