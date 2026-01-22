import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const SHARING_PUBLIC_API_CONFIG_TOKEN = 'SHARING_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class SharingPublicApiConfig {
	@ConfigProperty('FEATURE_COURSE_SHARE')
	@IsBoolean()
	@StringToBoolean()
	public featureCourseShare = false;

	@ConfigProperty('FEATURE_COLUMN_BOARD_SHARE')
	@IsBoolean()
	@StringToBoolean()
	public featureColumnBoardShare = false;

	@ConfigProperty('FEATURE_LESSON_SHARE')
	@IsBoolean()
	@StringToBoolean()
	public featureLessonShare = false;

	@ConfigProperty('FEATURE_TASK_SHARE')
	@IsBoolean()
	@StringToBoolean()
	public featureTaskShare = false;

	@ConfigProperty('FEATURE_ROOM_SHARE')
	@IsBoolean()
	@StringToBoolean()
	public featureRoomShare = true;
}
