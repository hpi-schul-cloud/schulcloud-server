# Application Layers

The following samples build on our default Mongo-Express stack.

The application is build on a 3-layer architecture. While the business layer is build by modules which may use each others public services (providers), it consumes different connected services.

## Controllers

Controllers are used to connect the application to the presentation layer, which provides a REST API. All data a controller retrieves or responds over the API have to be defined as DTO class. It must enforce Mapping incoming and outgoing data to DTO instances and apply [Validation](https://docs.nestjs.com/techniques/validation) and [Authentication]() using [Pipes](https://docs.nestjs.com/pipes).

Data Flow:
  - Incoming Data: API -> Validation -> Authentication -> DTO
  - Outgoing Data: DTO -> Serialization -> API

Models with ownership:
  - DTO for request and response models

## Business Layer

Protect that domain model from all the other technical intricacies involved in creating a web application.

## Data Layer

Before access data, a repository has to be implemented which is responsible to separate for example a database provider from the application.

## Models

We have to define models for two boundaries where the repository has its ownership for:
- DTOs are exported to the business layer only
- Entities/Documents rely on the Schema below and refer to a value object that is referenced by an id

Never export an entity without DTO conversion to the upper layer.

TODO: When convert to a DTO take care this might change the interface but the objects data must be filtered too (Solution: Mapper)! 
