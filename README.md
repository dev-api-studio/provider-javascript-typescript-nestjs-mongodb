# NestJS Mongoose Document Database Provider

Production-ready and testing-friendly document database provider for NestJS applications, implementing the `IDocumentDatabase` interface.

## Features

- ✅ **Mongoose Integration**: Full support for MongoDB 4.4 to 7.0
- ✅ **Multiple Mongoose Versions**: Compatible with Mongoose 6.x and 7.x
- ✅ **Complete CRUD Operations**: All 17 document database operations
- ✅ **Aggregation Pipeline**: Full MongoDB aggregation support
- ✅ **Bulk Operations**: Efficient batch processing
- ✅ **In-Memory Testing**: Fake implementation for unit tests
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **NestJS DI**: Seamless dependency injection

## Compatibility

| Component | Versions |
|-----------|----------|
| MongoDB | 4.4, 5.0, 6.0, 7.0 |
| Mongoose | 6.x, 7.x |
| @nestjs/mongoose | 9.x, 10.x |
| NestJS | 9.x, 10.x |

## Installation

```bash
# Production dependencies
npm install @nestjs/mongoose mongoose

# Or with yarn
yarn add @nestjs/mongoose mongoose

# Or with pnpm
pnpm add @nestjs/mongoose mongoose
```

## Usage

### Production Setup (with MongoDB)

```typescript
import { Module } from '@nestjs/common';
import { DocumentDatabaseModule } from './providers/javascript-typescript/nestjs/document-database';

@Module({
  imports: [
    DocumentDatabaseModule.forRoot({
      mongoUri: 'mongodb://localhost:27017/mydb',
      mongoOptions: {
        // Optional Mongoose connection options
        retryWrites: true,
        w: 'majority'
      }
    })
  ]
})
export class AppModule {}
```

### Testing Setup (with Fake In-Memory Database)

```typescript
import { Test } from '@nestjs/testing';
import { DocumentDatabaseModule } from './providers/javascript-typescript/nestjs/document-database';

const moduleRef = await Test.createTestingModule({
  imports: [
    DocumentDatabaseModule.forRoot({
      useFake: true // Use in-memory database for testing
    })
  ]
}).compile();
```

### Async Configuration

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DocumentDatabaseModule } from './providers/javascript-typescript/nestjs/document-database';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DocumentDatabaseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        mongoUri: configService.get('MONGODB_URI'),
        mongoOptions: {
          retryWrites: true
        }
      }),
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
```

### Using in Services

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DOCUMENT_DATABASE_TOKEN } from './providers/javascript-typescript/nestjs/document-database';
import { IDocumentDatabase } from './connectors/javascript-typescript/IDocumentDatabase';

@Injectable()
export class UserService {
  constructor(
    @Inject(DOCUMENT_DATABASE_TOKEN)
    private readonly db: IDocumentDatabase
  ) {}

  async createUser(userData: any) {
    return this.db.insertOne({
      collection: 'users',
      document: userData
    });
  }

  async findUserByEmail(email: string) {
    return this.db.findOne({
      collection: 'users',
      query: { email },
      projection: ['_id', 'email', 'name']
    });
  }

  async updateUser(id: string, updates: any) {
    return this.db.updateOne({
      collection: 'users',
      query: { _id: id },
      update: { $set: updates }
    });
  }

  async deleteUser(id: string) {
    return this.db.deleteOne({
      collection: 'users',
      query: { _id: id }
    });
  }
}
```

## Available Operations

### Read Operations

#### findById
Find a document by its ID.

```typescript
const user = await db.findById({
  collection: 'users',
  id: '507f1f77bcf86cd799439011',
  projection: ['name', 'email']
});
```

#### findOne
Find a single document matching a query.

```typescript
const user = await db.findOne({
  collection: 'users',
  query: { email: 'user@example.com' },
  projection: ['_id', 'name', 'email']
});
```

#### find
Find multiple documents with filtering, sorting, and pagination.

```typescript
const users = await db.find({
  collection: 'users',
  query: { status: 'active' },
  projection: ['name', 'email'],
  sort: [{ field: 'createdAt', order: -1 }],
  limit: 10,
  skip: 0
});
```

#### countDocuments
Count documents matching a query.

```typescript
const count = await db.countDocuments({
  collection: 'users',
  query: { status: 'active' }
});
```

#### aggregate
Execute MongoDB aggregation pipeline.

```typescript
const results = await db.aggregate({
  collection: 'orders',
  pipeline: [
    { $match: { status: 'completed' } },
    { $group: { _id: '$userId', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 10 }
  ]
});
```

### Write Operations

#### insertOne
Insert a single document.

```typescript
const result = await db.insertOne({
  collection: 'users',
  document: {
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date()
  }
});
// Returns: { insertedId: '507f1f77bcf86cd799439011' }
```

#### insertMany
Insert multiple documents.

```typescript
const result = await db.insertMany({
  collection: 'users',
  documents: [
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' }
  ]
});
// Returns: { insertedIds: [...], insertedCount: 2 }
```

#### updateOne
Update a single document.

```typescript
const result = await db.updateOne({
  collection: 'users',
  query: { email: 'john@example.com' },
  update: { $set: { name: 'John Smith' } },
  upsert: false
});
// Returns: { matchedCount: 1, modifiedCount: 1 }
```

#### updateMany
Update multiple documents.

```typescript
const result = await db.updateMany({
  collection: 'users',
  query: { status: 'pending' },
  update: { $set: { status: 'active' } }
});
// Returns: { matchedCount: 5, modifiedCount: 5 }
```

#### replaceOne
Replace an entire document.

```typescript
const result = await db.replaceOne({
  collection: 'users',
  query: { _id: '507f1f77bcf86cd799439011' },
  replacement: {
    name: 'New Name',
    email: 'new@example.com',
    updatedAt: new Date()
  },
  upsert: false
});
```

#### deleteOne
Delete a single document.

```typescript
const result = await db.deleteOne({
  collection: 'users',
  query: { email: 'user@example.com' }
});
// Returns: { deletedCount: 1 }
```

#### deleteMany
Delete multiple documents.

```typescript
const result = await db.deleteMany({
  collection: 'users',
  query: { status: 'inactive' }
});
// Returns: { deletedCount: 10 }
```

### Atomic Operations

#### findOneAndUpdate
Find and update a document atomically.

```typescript
const user = await db.findOneAndUpdate({
  collection: 'users',
  query: { email: 'user@example.com' },
  update: { $inc: { loginCount: 1 } },
  returnDocument: 'after', // 'before' or 'after'
  upsert: false
});
```

#### findOneAndReplace
Find and replace a document atomically.

```typescript
const user = await db.findOneAndReplace({
  collection: 'users',
  query: { _id: '507f1f77bcf86cd799439011' },
  replacement: { name: 'New Name', email: 'new@example.com' },
  returnDocument: 'after'
});
```

#### findOneAndDelete
Find and delete a document atomically.

```typescript
const deletedUser = await db.findOneAndDelete({
  collection: 'users',
  query: { email: 'user@example.com' }
});
```

### Bulk Operations

#### bulkWrite
Execute multiple write operations in a single batch.

```typescript
const result = await db.bulkWrite({
  collection: 'users',
  operations: [
    {
      type: 'insertOne',
      document: { name: 'User 1', email: 'user1@example.com' }
    },
    {
      type: 'updateOne',
      query: { email: 'user2@example.com' },
      update: { $set: { status: 'active' } }
    },
    {
      type: 'deleteOne',
      query: { email: 'user3@example.com' }
    }
  ]
});
// Returns: { insertedCount: 1, modifiedCount: 1, deletedCount: 1 }
```

## Query Operators

The fake memory implementation supports common MongoDB query operators:

### Comparison Operators
- `$eq`: Equal to
- `$ne`: Not equal to
- `$gt`: Greater than
- `$gte`: Greater than or equal to
- `$lt`: Less than
- `$lte`: Less than or equal to
- `$in`: In array
- `$nin`: Not in array

### Logical Operators
- `$exists`: Field exists
- `$regex`: Regular expression match

### Update Operators
- `$set`: Set field value
- `$unset`: Remove field
- `$inc`: Increment numeric value
- `$push`: Add to array
- `$pull`: Remove from array

## Testing

### Unit Tests with Fake Database

```typescript
import { Test } from '@nestjs/testing';
import { DocumentDatabaseModule, DOCUMENT_DATABASE_TOKEN } from './providers/javascript-typescript/nestjs/document-database';
import { IDocumentDatabase } from './connectors/javascript-typescript/IDocumentDatabase';

describe('UserService', () => {
  let db: IDocumentDatabase;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DocumentDatabaseModule.forRoot({ useFake: true })
      ],
      providers: [UserService]
    }).compile();

    db = moduleRef.get<IDocumentDatabase>(DOCUMENT_DATABASE_TOKEN);
  });

  it('should create a user', async () => {
    const result = await db.insertOne({
      collection: 'users',
      document: { name: 'Test User', email: 'test@example.com' }
    });

    expect(result.insertedId).toBeDefined();
  });

  it('should find a user by email', async () => {
    await db.insertOne({
      collection: 'users',
      document: { name: 'Test User', email: 'test@example.com' }
    });

    const user = await db.findOne({
      collection: 'users',
      query: { email: 'test@example.com' }
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

## Performance Considerations

### Production (Mongoose)
- Uses native MongoDB driver for optimal performance
- Supports connection pooling
- Efficient query execution with indexes
- Lean queries for better performance

### Testing (Fake Memory)
- In-memory operations are extremely fast
- No network overhead
- Perfect for unit tests
- Limited by available RAM

## Best Practices

1. **Use Projections**: Only select fields you need
```typescript
await db.find({
  collection: 'users',
  projection: ['name', 'email'] // Don't fetch unnecessary fields
});
```

2. **Use Indexes**: Create indexes for frequently queried fields
```typescript
// In your schema definition
@Schema()
export class User {
  @Prop({ index: true })
  email: string;
}
```

3. **Use Pagination**: Always limit results for large datasets
```typescript
await db.find({
  collection: 'users',
  limit: 20,
  skip: page * 20
});
```

4. **Use Bulk Operations**: Batch multiple writes for better performance
```typescript
await db.bulkWrite({
  collection: 'users',
  operations: [...] // Multiple operations in one call
});
```

5. **Use Aggregation**: For complex queries and data transformations
```typescript
await db.aggregate({
  collection: 'orders',
  pipeline: [
    { $match: { status: 'completed' } },
    { $group: { _id: '$userId', total: { $sum: '$amount' } } }
  ]
});
```

## Error Handling

```typescript
try {
  const user = await db.findById({
    collection: 'users',
    id: userId
  });
  
  if (!user) {
    throw new NotFoundException('User not found');
  }
  
  return user;
} catch (error) {
  if (error instanceof NotFoundException) {
    throw error;
  }
  throw new InternalServerErrorException('Database operation failed');
}
```

## Environment Variables

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/mydb
MONGODB_USER=admin
MONGODB_PASSWORD=secret
MONGODB_AUTH_SOURCE=admin

# For production with replica set
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0

# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority
```

## License

MIT

## Support

For issues and questions, please refer to the main Dev API Studio documentation.
