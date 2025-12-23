# RabbitMQ Schema Registry

This schema registry provides a centralized system for managing and validating RabbitMQ message schemas in the Schulcloud server application. It ensures type safety, version management, and validation of messages across all exchanges and events.

## Features

- **Schema Registration**: Register JSON schemas for message types
- **Message Validation**: Validate incoming/outgoing messages against registered schemas
- **Version Management**: Support for multiple schema versions
- **Type Safety**: Full TypeScript support with generic types
- **Centralized Configuration**: All schemas defined in one place
- **Automatic Validation**: Optional validation for producers and consumers

## Core Components

### SchemaRegistryService

The central service that manages all message schemas.

```typescript
@Injectable()
export class SchemaRegistryService {
  // Register a new schema
  registerSchema<T>(schema: Omit<MessageSchema<T>, 'createdAt'>): void
  
  // Validate a message against its schema
  validateMessage(exchange: string, event: string, version: string, message: unknown): ValidationResult
  
  // Get available schema versions
  getSchemaVersions(exchange: string, event: string): string[]
  
  // Check if schema exists
  hasSchema(exchange: string, event: string, version: string): boolean
}
```

### SchemaValidatedProducerService

Service for publishing messages with automatic validation.

```typescript
@Injectable()
export class SchemaValidatedProducerService {
  // Publish with validation
  async publishWithValidation(options: ValidatedPublishOptions): Promise<PublishResult>
  
  // Validate before publishing
  validateMessageBeforePublish(exchange: string, routingKey: string, message: unknown): ValidationResult
}
```

## Usage Examples

### 1. Registering a Custom Schema

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchemaRegistryService } from '@infra/rabbitmq';

@Injectable()
export class CustomSchemaRegistration implements OnModuleInit {
  constructor(private readonly schemaRegistry: SchemaRegistryService) {}

  async onModuleInit(): Promise<void> {
    // Define your message interface
    interface CustomMessage {
      userId: string;
      action: 'create' | 'update' | 'delete';
      timestamp: string;
      data?: any;
    }

    // Define the JSON schema
    const customMessageSchema: JSONSchemaType<CustomMessage> = {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        action: { type: 'string', enum: ['create', 'update', 'delete'] },
        timestamp: { type: 'string', format: 'date-time' },
        data: { nullable: true },
      },
      required: ['userId', 'action', 'timestamp'],
      additionalProperties: false,
    };

    // Register the schema
    this.schemaRegistry.registerSchema({
      id: 'custom-message-v1',
      version: '1.0.0',
      exchange: 'custom-exchange',
      event: 'custom-event',
      schema: customMessageSchema,
      description: 'Custom message for user actions',
    });
  }
}
```

### 2. Publishing Messages with Validation

```typescript
import { Injectable } from '@nestjs/common';
import { SchemaValidatedProducerService } from '@infra/rabbitmq';

@Injectable()
export class CustomProducer {
  constructor(private readonly producer: SchemaValidatedProducerService) {}

  async publishUserAction(userId: string, action: string, data?: any): Promise<void> {
    const message = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      data,
    };

    // Publish with validation (strict mode)
    const result = await this.producer.publishWithValidation({
      exchange: 'custom-exchange',
      routingKey: 'custom-event',
      message,
      schemaVersion: '1.0.0',
      strict: true, // Throws error if validation fails
    });

    if (!result.success) {
      throw new Error(`Failed to publish message: ${result.error}`);
    }
  }

  async publishUserActionSafe(userId: string, action: string, data?: any): Promise<boolean> {
    const message = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      data,
    };

    // Publish with validation (non-strict mode)
    const result = await this.producer.publishWithValidation({
      exchange: 'custom-exchange',
      routingKey: 'custom-event',
      message,
      schemaVersion: '1.0.0',
      strict: false, // Returns result instead of throwing
    });

    return result.success;
  }
}
```

### 3. Creating Schema-Validated Consumers

```typescript
import { RabbitSubscribe, RabbitPayload } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { SchemaRegistryService } from '@infra/rabbitmq';

@Injectable()
export class CustomConsumer {
  private readonly logger = new Logger(CustomConsumer.name);

  constructor(private readonly schemaRegistry: SchemaRegistryService) {}

  @RabbitSubscribe({
    exchange: 'custom-exchange',
    routingKey: 'custom-event',
    queue: 'custom-queue',
  })
  async handleCustomMessage(@RabbitPayload() payload: unknown): Promise<void> {
    try {
      // Extract schema metadata
      const message = payload as any;
      const schemaInfo = message.__schema;

      // Validate the message
      const validationResult = this.schemaRegistry.validateMessage(
        schemaInfo?.exchange || 'custom-exchange',
        schemaInfo?.event || 'custom-event',
        schemaInfo?.version || '1.0.0',
        message
      );

      if (!validationResult.isValid) {
        this.logger.error('Invalid message received', {
          errors: validationResult.errors,
          message,
        });
        return; // Or throw error to reject message
      }

      // Process the validated message
      await this.processValidatedMessage(message);
    } catch (error) {
      this.logger.error('Error processing message', error);
      throw error; // Re-throw to trigger retry/dead letter
    }
  }

  private async processValidatedMessage(message: any): Promise<void> {
    // Your business logic here
    this.logger.log('Processing valid message', { message });
  }
}
```

## Predefined Schemas

The schema registry comes with predefined schemas for existing message types:

### Files Storage Events
- `copy-files-of-parent` (v1.0.0)
- `list-files-of-parent` (v1.0.0)
- `delete-files-of-parent` (v1.0.0)
- `delete-files` (v1.0.0)
- `remove-creatorid-of-files` (v1.0.0)

### H5P Editor Events
- `delete-content` (v1.0.0)
- `copy-content` (v1.0.0)

### Schulconnex Provisioning Events
- `schulconnex-group-provisioning` (v1.0.0)
- `schulconnex-group-removal` (v1.0.0)
- `schulconnex-license-provisioning` (v1.0.0)

## Configuration

The schema registry is automatically configured when the `RabbitMQWrapperModule` is imported. All predefined schemas are registered during module initialization.

```typescript
import { Module } from '@nestjs/common';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';

@Module({
  imports: [RabbitMQWrapperModule],
  // ...
})
export class YourModule {}
```

## Schema Versioning

The schema registry supports multiple versions of the same schema. When updating a message format:

1. **Create a new schema version** instead of modifying existing ones
2. **Update producers** to use the new version
3. **Update consumers** to handle both old and new versions during transition
4. **Remove old versions** once all systems are updated

Example:
```typescript
// Version 1.0.0
const userMessageV1 = {
  id: 'user-message-v1',
  version: '1.0.0',
  schema: { /* ... */ }
};

// Version 2.0.0 (with additional fields)
const userMessageV2 = {
  id: 'user-message-v2',
  version: '2.0.0',
  schema: { /* ... with new fields */ }
};
```

## Error Handling

### Validation Errors
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: SchemaValidationError[];
}

interface SchemaValidationError {
  message: string;
  field?: string;
  value?: unknown;
}
```

### Common Error Scenarios
1. **Schema not found**: When trying to validate against a non-existent schema
2. **Validation failure**: When message doesn't match the schema
3. **Publishing failure**: When AMQP connection fails during publishing

## Best Practices

1. **Always define schemas for new message types**
2. **Use strict validation in production for critical messages**
3. **Include descriptive error messages in schemas**
4. **Version schemas appropriately**
5. **Test schema validation in unit tests**
6. **Monitor validation failures in production**
7. **Use meaningful schema IDs and descriptions**

## Testing

```typescript
import { Test } from '@nestjs/testing';
import { SchemaRegistryService } from '@infra/rabbitmq';

describe('Custom Message Schema', () => {
  let schemaRegistry: SchemaRegistryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SchemaRegistryService],
    }).compile();

    schemaRegistry = module.get(SchemaRegistryService);
    
    // Register your test schema
    schemaRegistry.registerSchema(yourTestSchema);
  });

  it('should validate correct message', () => {
    const validMessage = { /* ... */ };
    const result = schemaRegistry.validateMessage('exchange', 'event', '1.0.0', validMessage);
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid message', () => {
    const invalidMessage = { /* ... */ };
    const result = schemaRegistry.validateMessage('exchange', 'event', '1.0.0', invalidMessage);
    expect(result.isValid).toBe(false);
  });
});
```

## Migration Guide

To migrate existing producers and consumers to use schema validation:

1. **Define schemas** for your existing message types
2. **Update producers** to use `SchemaValidatedProducerService`
3. **Update consumers** to validate incoming messages
4. **Test thoroughly** with both valid and invalid messages
5. **Deploy gradually** using feature flags if needed

## Monitoring

Monitor schema validation in production:

```typescript
// Log validation failures
if (!validationResult.isValid) {
  this.logger.warn('Schema validation failed', {
    exchange,
    event,
    version,
    errors: validationResult.errors,
    messageId: message.id, // Include message identifier if available
  });
}
```

## Performance Considerations

- Schemas are compiled once during registration for optimal validation performance
- Use specific schemas rather than overly permissive ones
- Consider message size when defining schemas
- Monitor validation performance in high-throughput scenarios