# Domain Object Validation

If you need to validate a domain object, please write an independent class, so that the domain object itself, its repo and services can reuse it.

Eric Evans suggests using the specification pattern.  
A specification fulfills the following interface:
```typescript
public interface Specification<T> {
    boolean isSatisfiedBy(T t);
}
```

A specification checks if a domain object fulfills the conditions of the specification.

A specification can simply specify that a domain object is valid. E.g. a `Task` has an owner and a description.  
A specification can specify more complex and specialized conditions. E.g. `Task` where every student assigned to the task's course has handed in a submission.  

The specification pattern in its full extend describes how to use logic operators to combine multiple specifications into combined specifications as well. Please don't build this as long as you don't need it. YAGNI.  
[More about full specification pattern](https://medium.com/@pawel_klimek/domain-driven-design-specification-pattern-82867540305c)
