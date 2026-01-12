# API Contracts: Youth Content CMS

**Phase**: Phase 1 - Data Model & Contracts  
**Date**: 2026-01-10

This directory contains JSON Schema definitions for all document types in the Youth Content CMS.

---

## Schema Files

The following JSON Schema files define validation contracts for Sanity documents:

### Document Schemas

1. **video.schema.json** - YouTube video document with category assignment
2. **category.schema.json** - Age-based hierarchical category
3. **adPlacement.schema.json** - Dynamic advertisement placement
4. **affiliatePartner.schema.json** - Affiliate marketing partner
5. **user.schema.json** - CMS user with role-based permissions
6. **activityLog.schema.json** - Activity logging for analytics

### Master Schema

- **schemas.json** - Combined schema definitions with entity relationships

---

## Usage

These JSON schemas serve as:

1. **Contract Validation**: Ensure data structure consistency
2. **API Documentation**: Define expected request/response formats
3. **Type Generation**: Generate TypeScript interfaces
4. **Testing**: Validate test fixtures against schemas
5. **Migration Scripts**: Validate data transformations

---

## Schema Format

All schemas follow [JSON Schema Draft 07](https://json-schema.org/draft-07/schema) specification.

**Example Structure**:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EntityName",
  "type": "object",
  "required": ["field1", "field2"],
  "properties": {
    "_id": { "type": "string" },
    "_type": { "const": "entityName" },
    "field1": { "type": "string" }
  }
}
```

---

## Validation Rules

Schemas enforce:

- **Required fields**: Marked in `required` array
- **Type constraints**: String, number, boolean, object, array
- **Value constraints**: Min/max length, patterns, enums
- **Format validation**: Email, URL, ISO 8601 dates
- **Reference integrity**: Document references via `_ref` fields

---

## Generating TypeScript Types

Use JSON Schema to generate TypeScript interfaces:

```bash
# Install json-schema-to-typescript
npm install -g json-schema-to-typescript

# Generate types
json2ts contracts/video.schema.json > schemaTypes/generated/video.types.ts
```

---

## Status

**Current Status**: 📝 Schema definitions pending

Schemas will be generated as part of Phase 1 implementation. See `../data-model.md` for complete entity definitions that inform these schemas.

**Next Steps**:
1. Generate JSON Schema files from data model
2. Validate schemas against sample data
3. Use schemas for TypeScript type generation
4. Integrate schemas into CI/CD validation

---

**Contracts Directory Status**: ✅ STRUCTURE READY  
**Schema Files**: Pending Phase 1 implementation  
**Reference**: See `../data-model.md` for entity specifications
