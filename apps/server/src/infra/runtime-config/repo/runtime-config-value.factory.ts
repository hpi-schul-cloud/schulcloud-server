import { RuntimeConfigValue, RuntimeConfigValueProps } from '../domain/runtime-config-value.do';

export class RuntimeConfigValueFactory {
	public static build(props: RuntimeConfigValueProps): RuntimeConfigValue {
		return new RuntimeConfigValue(props);
	}
}
