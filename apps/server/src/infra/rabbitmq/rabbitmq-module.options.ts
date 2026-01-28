export enum RabbitMQExchangeType {
	DIRECT = 'direct',
	FANOUT = 'fanout',
	TOPIC = 'topic',
	HEADERS = 'headers',
}
export interface InternalRabbitMQExchangeConfig {
	exchangeName: string;
	exchangeType: RabbitMQExchangeType;
}

export interface InternalRabbitMQConfig {
	prefetchCount: number;
	heartBeatIntervalInSeconds: number;
	uri: string;
}

export interface RabbitMQModuleOptions {
	exchangeConfigInjectionToken: string;
	exchangeConfigConstructor: new () => InternalRabbitMQExchangeConfig;
	configInjectionToken: string;
	configConstructor: new () => InternalRabbitMQConfig;
}
