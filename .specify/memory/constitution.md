# CurateKids Sanity Studio Constitution

## Core Principles

### I. Single Responsibility Principle (SRP)
Each schema type, field definition, and configuration module must have ONE clear purpose:
- Schema types define ONLY document/object structure
- Validation logic separated from schema definitions
- Preview configurations isolated and composable
- Helper functions in dedicated utility modules
- No mixed concerns within a single file

### II. Open/Closed Principle (OCP)
Code must be open for extension, closed for modification:
- Use Sanity plugins for extending functionality
- Schema types composed via references, not inheritance
- Configuration extensions via plugins array
- Field types extended through custom components
- No direct modification of core schema after deployment

### III. Liskov Substitution Principle (LSP)
Schema types and field definitions must be substitutable:
- All document types implement consistent base interface
- Reference fields interchangeable where types match
- Array field items follow same structure contract
- Custom input components honor native Sanity API
- Preview configurations follow standard select/prepare pattern

### IV. Interface Segregation Principle (ISP)
Schema definitions must not force unnecessary dependencies:
- Object types contain only required fields
- Document types expose minimal field set
- Field groups separate optional from required
- Validation rules applied per-field, not globally
- Preview selections include only needed fields

### V. Dependency Inversion Principle (DIP)
High-level modules must not depend on low-level details:
- Schema types depend on Sanity abstractions (defineType, defineField)
- Business logic references interfaces, not implementations
- Configuration depends on plugin contracts
- Custom components depend on Sanity component API
- External services accessed via abstraction layer

## Code Complexity Standards (NON-NEGOTIABLE)

### Cyclomatic Complexity Limit: 5
Every function, method, and code block MUST maintain cyclomatic complexity ≤ 5:
- Maximum 4 decision points per function (if/else, switch, ternary, &&, ||, loops)
- Complex validation split into smaller validators
- Nested conditions refactored to guard clauses
- Prepare functions decomposed into helper methods
- Automated complexity checks in CI/CD pipeline

**Enforcement**:
- ESLint `complexity` rule set to `["error", 5]`
- Pre-commit hooks validate complexity
- PR reviews MUST verify complexity metrics
- Violations block merge

**Refactoring Pattern**:
```typescript
// ❌ BAD (Complexity > 5)
function validate(data) {
  if (data.type === 'movie') {
    if (data.releaseDate) {
      if (new Date(data.releaseDate) > new Date()) {
        if (data.cast && data.cast.length > 0) {
          return true
        }
      }
    }
  }
  return false
}

// ✅ GOOD (Complexity = 1-2 per function)
const isMovie = (data) => data.type === 'movie'
const hasValidDate = (date) => date && new Date(date) <= new Date()
const hasCast = (cast) => cast && cast.length > 0

function validate(data) {
  return isMovie(data) && 
         hasValidDate(data.releaseDate) && 
         hasCast(data.cast)
}
```

## Architecture Standards

### Schema Organization
- **Document Types**: Top-level content types (movie, person, screening)
- **Object Types**: Reusable embedded types (castMember, crewMember)
- **Block Content**: Rich text configurations
- **One Type Per File**: No multi-type definitions
- **Index File**: Central export, categorized by type

### Naming Conventions
- Schema names: camelCase (movie, castMember)
- File names: camelCase matching schema name (movie.ts)
- Field names: camelCase (releaseDate, externalId)
- Type definitions: PascalCase when needed (MovieDocument)

### Type Safety
- TypeScript strict mode enabled
- All schema fields properly typed
- No `any` types without justification
- Reference types explicitly defined
- Custom validation with type guards

## Quality Gates

### Pre-Commit
- ESLint with complexity checks
- Prettier formatting
- TypeScript compilation
- No console.log statements

### Pre-Merge
- All tests passing
- Code coverage ≥ 80%
- Complexity metrics ≤ 5
- No ESLint warnings
- TypeScript strict checks passing
- Schema validation tests passing

### Testing Requirements
- Unit tests for validation functions
- Integration tests for schema references
- Preview function tests
- Custom component tests
- Mock data factories for testing

## Development Workflow

### Schema Changes
1. Define schema type with defineType/defineField
2. Write validation tests FIRST
3. Implement validation logic (complexity ≤ 5)
4. Add preview configuration
5. Update index.ts export
6. Run full test suite
7. Deploy to development dataset

### Code Review Checklist
- [ ] Cyclomatic complexity ≤ 5 verified
- [ ] SOLID principles followed
- [ ] Single responsibility per module
- [ ] No duplicate code (DRY)
- [ ] Type safety maintained
- [ ] Tests cover edge cases
- [ ] Documentation updated
- [ ] Schema backward compatible

## Performance Standards

### Schema Loading
- Initial load < 2s
- Lazy load heavy fields
- Optimize preview selections
- Minimize reference depth
- Cache computed values

### Build Optimization
- Tree-shaking enabled
- Bundle size monitored
- Dynamic imports for heavy dependencies
- No circular dependencies

## Security Requirements

### Content Validation
- Input sanitization for all text fields
- XSS prevention in rich text
- URL validation for external links
- File type restrictions on uploads
- Size limits on media uploads

### Access Control
- Role-based permissions configured
- Document-level access rules
- Field-level security where needed
- API token rotation policy
- Audit logging enabled

## Versioning & Changes

### Schema Versioning
- Semantic versioning: MAJOR.MINOR.PATCH
- Breaking changes require MAJOR bump
- New fields require MINOR bump
- Bug fixes require PATCH bump
- Migration scripts for breaking changes

### Backward Compatibility
- New required fields must have defaults
- Deprecated fields maintained for 2 versions
- Type changes require migration path
- Document structure changes communicated

## Governance

### Constitution Authority
This constitution is the supreme authority for all development decisions:
- All code must comply with these principles
- Exceptions require documented justification
- Amendments require team consensus
- Violations identified in code review

### Amendment Process
1. Proposal documented with rationale
2. Team discussion and consensus
3. Update constitution version
4. Create migration plan if needed
5. Update tooling/linting rules
6. Communicate to all stakeholders

### Compliance Verification
- Automated linting enforces rules
- PR template includes compliance checklist
- Quarterly constitution review
- Metrics dashboard for complexity tracking
- Regular refactoring sessions

**Version**: 1.0.0 | **Ratified**: 2026-01-10 | **Last Amended**: 2026-01-10
