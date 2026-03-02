import { Injectable } from '@nestjs/common';
import { CourseRoomsApi, SingleColumnBoardResponse } from '../generated';
import { AdapterUtils } from './adapter.utils';

@Injectable()
export class CourseRoomsClientAdapter {
	constructor(private readonly courseRoomsApi: CourseRoomsApi) {}

	public async getRoomBoardByCourseId(jwt: string, roomId: string): Promise<SingleColumnBoardResponse> {
		const response = await this.courseRoomsApi.courseRoomsControllerGetRoomBoard(
			roomId,
			AdapterUtils.createAxiosConfigForJwt(jwt)
		);

		return response.data;
	}
}
