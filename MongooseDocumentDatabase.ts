import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { IDocumentDatabase } from '../../../../connectors/javascript-typescript/IDocumentDatabase';

/**
 * Mongoose Document Database Implementation for NestJS
 * Supports MongoDB 4.4 to 7.0 with Mongoose 6.x and 7.x
 * 
 * Compatible with:
 * - @nestjs/mongoose: ^9.0.0, ^10.0.0
 * - mongoose: ^6.0.0, ^7.0.0
 * - MongoDB: 4.4, 5.0, 6.0, 7.0
 */
@Injectable()
export class MongooseDocumentDatabase implements IDocumentDatabase {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  /**
   * Find a single document by ID
   */
  async findById(params: {
    collection: string;
    id: string;
    projection?: string[];
  }): Promise<any> {
    const model = this.connection.model(params.collection);
    const query = model.findById(params.id);

    if (params.projection && params.projection.length > 0) {
      const projectionObj = params.projection.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {} as Record<string, number>);
      query.select(projectionObj);
    }

    return query.lean().exec();
  }

  /**
   * Find a single document matching query
   */
  async findOne(params: {
    collection: string;
    query?: Record<string, any>;
    projection?: string[];
  }): Promise<any> {
    const model = this.connection.model(params.collection);
    const query = model.findOne(params.query || {});

    if (params.projection && params.projection.length > 0) {
      const projectionObj = params.projection.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {} as Record<string, number>);
      query.select(projectionObj);
    }

    return query.lean().exec();
  }

  /**
   * Find multiple documents
   */
  async find(params: {
    collection: string;
    query?: Record<string, any>;
    projection?: string[];
    sort?: Array<{ field: string; order: 1 | -1 }>;
    limit?: number;
    skip?: number;
  }): Promise<any[]> {
    const model = this.connection.model(params.collection);
    let query = model.find(params.query || {});

    if (params.projection && params.projection.length > 0) {
      const projectionObj = params.projection.reduce((acc, field) => {
        acc[field] = 1;
        return acc;
      }, {} as Record<string, number>);
      query = query.select(projectionObj);
    }

    if (params.sort && params.sort.length > 0) {
      const sortObj = params.sort.reduce((acc, s) => {
        acc[s.field] = s.order;
        return acc;
      }, {} as Record<string, 1 | -1>);
      query = query.sort(sortObj);
    }

    if (params.skip !== undefined) {
      query = query.skip(params.skip);
    }

    if (params.limit !== undefined) {
      query = query.limit(params.limit);
    }

    return query.lean().exec();
  }

  /**
   * Count documents matching query
   */
  async countDocuments(params: {
    collection: string;
    query?: Record<string, any>;
  }): Promise<number> {
    const model = this.connection.model(params.collection);
    return model.countDocuments(params.query || {}).exec();
  }

  /**
   * Execute aggregation pipeline
   */
  async aggregate(params: {
    collection: string;
    pipeline: any[];
  }): Promise<any[]> {
    const model = this.connection.model(params.collection);
    return model.aggregate(params.pipeline).exec();
  }

  /**
   * Insert a single document
   */
  async insertOne(params: {
    collection: string;
    document: Record<string, any>;
  }): Promise<{ insertedId: string }> {
    const model = this.connection.model(params.collection);
    const result = await model.create(params.document);
    return { insertedId: result._id.toString() };
  }

  /**
   * Insert multiple documents
   */
  async insertMany(params: {
    collection: string;
    documents: Array<Record<string, any>>;
  }): Promise<{ insertedIds: string[]; insertedCount: number }> {
    const model = this.connection.model(params.collection);
    const results = await model.insertMany(params.documents);
    return {
      insertedIds: results.map(doc => doc._id.toString()),
      insertedCount: results.length
    };
  }

  /**
   * Update a single document
   */
  async updateOne(params: {
    collection: string;
    query: Record<string, any>;
    update: Record<string, any>;
    upsert?: boolean;
  }): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: string }> {
    const model = this.connection.model(params.collection);
    const result = await model.updateOne(
      params.query,
      params.update,
      { upsert: params.upsert || false }
    ).exec();

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId?.toString()
    };
  }

  /**
   * Update multiple documents
   */
  async updateMany(params: {
    collection: string;
    query: Record<string, any>;
    update: Record<string, any>;
  }): Promise<{ matchedCount: number; modifiedCount: number }> {
    const model = this.connection.model(params.collection);
    const result = await model.updateMany(params.query, params.update).exec();

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    };
  }

  /**
   * Replace a single document
   */
  async replaceOne(params: {
    collection: string;
    query: Record<string, any>;
    replacement: Record<string, any>;
    upsert?: boolean;
  }): Promise<{ matchedCount: number; modifiedCount: number; upsertedId?: string }> {
    const model = this.connection.model(params.collection);
    const result = await model.replaceOne(
      params.query,
      params.replacement,
      { upsert: params.upsert || false }
    ).exec();

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId?.toString()
    };
  }

  /**
   * Delete a single document
   */
  async deleteOne(params: {
    collection: string;
    query: Record<string, any>;
  }): Promise<{ deletedCount: number }> {
    const model = this.connection.model(params.collection);
    const result = await model.deleteOne(params.query).exec();

    return {
      deletedCount: result.deletedCount
    };
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(params: {
    collection: string;
    query: Record<string, any>;
  }): Promise<{ deletedCount: number }> {
    const model = this.connection.model(params.collection);
    const result = await model.deleteMany(params.query).exec();

    return {
      deletedCount: result.deletedCount
    };
  }

  /**
   * Find one document and update it
   */
  async findOneAndUpdate(params: {
    collection: string;
    query: Record<string, any>;
    update: Record<string, any>;
    returnDocument?: 'before' | 'after';
    upsert?: boolean;
  }): Promise<any> {
    const model = this.connection.model(params.collection);
    const result = await model.findOneAndUpdate(
      params.query,
      params.update,
      {
        new: params.returnDocument === 'after',
        upsert: params.upsert || false,
        lean: true
      }
    ).exec();

    return result;
  }

  /**
   * Find one document and replace it
   */
  async findOneAndReplace(params: {
    collection: string;
    query: Record<string, any>;
    replacement: Record<string, any>;
    returnDocument?: 'before' | 'after';
    upsert?: boolean;
  }): Promise<any> {
    const model = this.connection.model(params.collection);
    const result = await model.findOneAndReplace(
      params.query,
      params.replacement,
      {
        new: params.returnDocument === 'after',
        upsert: params.upsert || false,
        lean: true
      }
    ).exec();

    return result;
  }

  /**
   * Find one document and delete it
   */
  async findOneAndDelete(params: {
    collection: string;
    query: Record<string, any>;
  }): Promise<any> {
    const model = this.connection.model(params.collection);
    const result = await model.findOneAndDelete(params.query, { lean: true }).exec();
    return result;
  }

  /**
   * Execute bulk write operations
   */
  async bulkWrite(params: {
    collection: string;
    operations: Array<{
      type: 'insertOne' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany' | 'replaceOne';
      document?: Record<string, any>;
      query?: Record<string, any>;
      update?: Record<string, any>;
    }>;
  }): Promise<{ insertedCount: number; modifiedCount: number; deletedCount: number }> {
    const model = this.connection.model(params.collection);
    
    const bulkOps = params.operations.map(op => {
      switch (op.type) {
        case 'insertOne':
          return { insertOne: { document: op.document } };
        case 'updateOne':
          return { updateOne: { filter: op.query, update: op.update } };
        case 'updateMany':
          return { updateMany: { filter: op.query, update: op.update } };
        case 'deleteOne':
          return { deleteOne: { filter: op.query } };
        case 'deleteMany':
          return { deleteMany: { filter: op.query } };
        case 'replaceOne':
          return { replaceOne: { filter: op.query, replacement: op.document } };
        default:
          throw new Error(`Unsupported operation type: ${op.type}`);
      }
    });

    const result = await model.bulkWrite(bulkOps);

    return {
      insertedCount: result.insertedCount,
      modifiedCount: result.modifiedCount,
      deletedCount: result.deletedCount
    };
  }
}
