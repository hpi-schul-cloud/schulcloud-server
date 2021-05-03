# Application Structure

The application is build on a 3-layer architecture. While the business layer is build by modules which may use each others public services (providers), it consumes different connected services.

## Application Layers

### Controllers

Controllers are used to connect the application to the presentation layer, which provides a REST API. All data a controller retrieves or responds over the API have to be defined as DTO class. It must enforce Mapping incoming and outgoing data to DTO instances and apply *Validation* and *Authentication* using [Pipes](https://docs.nestjs.com/pipes).

### dwedew

## Interface Ownership
