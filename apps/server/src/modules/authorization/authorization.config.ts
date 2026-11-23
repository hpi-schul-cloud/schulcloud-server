import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean } from 'class-validator';

export const AUTHORIZATION_CONFIG_TOKEN = 'AUTHORIZATION_CONFIG_TOKEN';

@Configuration()
export class AuthorizationConfig {
	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE')
	@IsBoolean()
	@StringToBoolean()
	public teacherStudentVisibilityIsConfigurable = false;

	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT')
	@IsBoolean()
	@StringToBoolean()
	public teacherStudentVisibilityIsEnabledByDefault = true;
}
