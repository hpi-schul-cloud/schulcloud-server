# RabbitMQ Schema Registry - Quick Start

This guide will help you quickly set up and start using the RabbitMQ Schema Registry.

## ✅ Setup Checklist

### 1. Module Import
- [ ] Import `RabbitMQWrapperModule` in your application module
- [ ] Verify RabbitMQ configuration is correct

### 2. Basic Usage
- [ ] Replace direct `AmqpConnection` usage with `SchemaValidatedProducerService`
- [ ] Use predefined schemas for existing message types
- [ ] Add validation to your message publishers

### 3. Testing
- [ ] Run tests to ensure everything works: `npm test -- --testPathPattern=schema-registry`
- [ ] Build the application: `npm run nest:build`
- [ ] Check for TypeScript compilation errors

## 🚀 Getting Started in 5 Minutes

### Step 1: Import the Module

```typescript
import { Module } from '@nestjs/common';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';

@Module({
  imports: [
    RabbitMQWrapperModule, // Automatically registers predefined schemas
  ],
})
export class AppModule {}
```

### Step 2: Use Validated Publisher

```typescript
import { Injectable } from '@nestjs/common';
import { SchemaValidatedProducerService, FilesStorageExchange } from '@infra/rabbitmq';

@Injectable()
export class FileService {
  constructor(
    private readonly producer: SchemaValidatedProducerService,
  ) {}

  async deleteFiles(fileIds: string[]): Promise<void> {
    await this.producer.publishWithValidation({
      exchange: FilesStorageExchange,
      routingKey: 'delete-files',
      message: { fileIds },
      schemaId: 'delete-files-v1',
    });
  }
}
```

### Step 3: Verify Setup

```bash
# Build the application
npm run nest:build

# Run schema registry tests
npm test -- --testPathPattern=schema-registry
```

## 📋 Available Schemas

### Files Storage
- `copy-files-of-parent-v1` - Copy files between parents
- `list-files-of-parent-v1` - List files of a parent
- `delete-files-of-parent-v1` - Delete all files of a parent
- `delete-files-v1` - Delete specific files
- `remove-creatorid-of-files-v1` - Remove creator ID

### H5P Editor
- `delete-content-v1` - Delete H5P content
- `copy-content-v1` - Copy H5P content

### Schulconnex Provisioning
- `schulconnex-group-provisioning-v1` - Provision groups
- `schulconnex-group-removal-v1` - Remove from groups
- `schulconnex-license-provisioning-v1` - Provision licenses

## 🛠️ Common Patterns

### Publishing with Validation

```typescript
// Strict mode (throws on validation failure)
await this.producer.publishWithValidation({
  exchange: 'files-storage',
  routingKey: 'delete-files',
  message: { fileIds: ['file-1', 'file-2'] },
  schemaId: 'delete-files-v1',
  strict: true, // Default
});

// Non-strict mode (logs warnings but continues)
await this.producer.publishWithValidation({
  exchange: 'files-storage',
  routingKey: 'delete-files',
  message: { fileIds: [] }, // Invalid but won't throw
  schemaId: 'delete-files-v1',
  strict: false,
});
```

### Manual Validation

```typescript
import { SchemaRegistryService } from '@infra/rabbitmq';

// Validate without publishing
const result = await this.schemaRegistry.validateMessage('delete-files-v1', {
  fileIds: ['file-1'],
});

if (!result.isValid) {
  console.error('Validation failed:', result.errors);
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Schema not found**: Ensure schema is registered in the predefined schemas
2. **Validation failures**: Check message structure matches schema exactly
3. **Type errors**: Verify import statements and exchange constants
4. **Build failures**: Run `npm run nest:build` to identify issues

### Debug Mode

Set `LOG_LEVEL=debug` to see detailed validation logs:

```bash
LOG_LEVEL=debug npm run start:dev
```

## 📖 Next Steps

1. **Read the full documentation**: [README.md](./README.md)
2. **Explore examples**: Check the `examples/` directory
3. **Review tests**: Look at the test files for more usage patterns
4. **Create custom schemas**: Follow the advanced usage guide

## 💡 Tips

- Use descriptive schema IDs with version suffixes
- Always validate in strict mode for production
- Monitor validation errors in your logs
- Keep schemas simple and focused
- Version schemas when making breaking changes

Need help? Check the comprehensive [README.md](./README.md) or examine the test files for more examples!