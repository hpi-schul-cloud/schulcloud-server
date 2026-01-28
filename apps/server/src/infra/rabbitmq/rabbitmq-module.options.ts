export interface InternalRabbitMQExchange {
	exchangeName: string;
	exchangeType: string;
}

export interface InternalRabbitMqConfig {
	prefetchCount: number;
	heartBeatIntervalInSeconds: number;
	uri: string;
}

export interface RabbitMQModuleOptions {
	exchangeInjectionToken: string;
	exchangeConstructor: new () => InternalRabbitMQExchange;
	configInjectionToken: string;
	configConstructor: new () => InternalRabbitMqConfig;
}
