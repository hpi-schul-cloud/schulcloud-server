# Code Style

## Classes

### Order of declarations

Classes are declared in the following order:
1. properties
2. constructor
3. methods

Example:
```Typescript
export class Course {
  // 1. properties
  name: string;
  
  // more properties...

  // 2. constructor
  constructor(props: { name: string }) {
    // ...
  }

  // 3. methods
  getShortTitle(): string {
    // ...
  }

  // more methods...
}
```
