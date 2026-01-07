import { Injectable } from '@nestjs/common';
import { IDocumentDatabase } from '../../../../connectors/javascript-typescript/IDocumentDatabase';

/**
 * Fake In-Memory Document Database Implementation for Testing (NestJS)
 * Simulates MongoDB operations in memory without external dependencies
 * 
 * Features:
 * - No MongoDB or Mongoose required
 * - Perfect for unit testing
 * - Fast and lightweight
 * - Supports all IDocumentDatabase operations
 */
@Injectable()
export class FakeMemoryDocumentDatabase implements IDocumentDatabase {
  private collections: Map<string, Map<string, any>> = new Map();
  private idCounter = 1;

  /**
   * Get or create a collection
   */
  private getCollection(name: string): Map<string, any> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name)!;
  }

  /**
   * Generate a new ID
   */
  private generateId(): string {
    return `fake_${this.idCounter++}`;
  }

  /**
   * Apply projection to a document
   */
  private applyProjection(doc: any, projection?: string[]): any {
    if (!projection || projection.length === 0) {
      return { ...doc };
    }

    const result: any = {};
    for (const field of projection) {
      if (field in doc) {
        result[field] = doc[field];
      }
    }
    return result;
  }

  /**
   * Check if a document matches a query
   */
  private matchesQuery(doc: any, query: Record<string, any>): boolean {
    if (!query || Object.keys(query).length === 0) {
      return true;
    }

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle MongoDB operators
        for (const [operator, operatorValue] of Object.entries(value)) {
          switch (operator) {
            case '$eq':
              if (doc[key] !== operatorValue) return false;
              break;
            case '$ne':
              if (doc[key] === operatorValue) return false;
              break;
            case '$gt':
              if (!(doc[key] > operatorValue)) return false;
              break;
            case '$gte':
              if (!(doc[key] >= operatorValue)) return false;
              break;
            case '$lt':
              if (!(doc[key] < operatorValue)) return false;
              break;
            case '$lte':
              if (!(doc[key] <= operatorValue)) return false;
              break;
            case '$in':
              if (!Array.isArray(operatorValue) || !operatorValue.includes(doc[key])) return false;
              break;
            case '$nin':
              if (!Array.isArray(operatorValue) || operatorValue.includes(doc[key])) return false;
              break;
            case '$exists':
              if (operatorValue && !(key in doc)) return false;
              if (!operatorValue && (key in doc)) return false;
              break;
            case '$regex':
              const regex = new RegExp(operatorValue);
              if (!regex.test(doc[key])) return false;
              break;
            default:
              // Nested object comparison
              if (JSON.stringify(doc[key]) !== JSON.stringify(value)) return false;
          }
        }
      } else {
        // Direct value comparison
        if (doc[key] !== value) return false;
      }
    }

    return true;
  }

  /**
   * Apply update operators to a document
   */
  private applyUpdate(doc: any, update: Record<string, any>): any {
    const result = { ...doc };

    for (const [operator, fields] of Object.entries(update)) {
      if (operator.startsWith('$')) {
        switch (operator) {
          case '$set':
            Object.assign(result, fields);
            break;
          case '$unset':
            for (const field of Object.keys(fields)) {
              delete result[field];
            }
            break;
          case '$inc':
            for (const [field, value] of Object.entries(fields)) {
              result[field] = (result[field] || 0) + (value as number);
            }
            break;
          case '$push':
            for (const [field, value] of Object.entries(fields)) {
              if (!Array.isArray(result[field])) {
                result[field] = [];
              }
              result[field].push(value);
            }
            break;
          case '$pull':
            for (const [field, value] of Object.entries(fields)) {
              if (Array.isArray(result[field])) {
                result[field] = result[field].filter((item: any) => item !== value);
              }
            }
            break;
        }
      } else {
        // Direct field assignment
        result[operator] = fields;
      }
    }

    return result;
  }

  /**
   * Sort documents
   */
  private sortDocuments(docs: any[], sort?: Array<{ field: string; order: 1 | -1 }>): any[] {
    if (!sort || sort.length === 0) {
      return docs;
    }

    return [...docs].sort((a, b) => {
      for (const { field, order } of sort) {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
      }
      return 0;
    });
  }

  /**
   * Find a single document by ID
   */
  async findById(params: {
    collection: string;
    id: string;
    projection?: string[];
  }): Promise<any> {
    const collection = this.getCollection(params.collection);
    const doc = collection.get(params.id);

    if (!doc) {
      return null;
    }

    return this.applyProjection(doc, params.projection);
  }

  /**
   * Find a single document matching query
   */
  async findOne(params: {
    collection: string;
    query?: Record<string, any>;
    projection?: string[];
  }): Promise<any> {
    const collection = this.getCollection(params.collection);
    
    for (const doc of collection.values()) {
      if (this.matchesQuery(doc, params.query || {})) {
        return this.applyProjection(doc, params.projection);
      }
    }

    return null;
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
    const collection = this.getCollection(params.collection);
    
    let results: any[] = [];
    for (const doc of collection.values()) {
      if (this.matchesQuery(doc, params.query || {})) {
        results.push(this.applyProjection(doc, params.projection));
      }
    }

    // Apply sorting
    results = this.sortDocuments(results, params.sort);

    // Apply skip
    if (params.skip !== undefined && params.skip > 0) {
      results = results.slice(params.skip);
    }

    // Apply limit
    if (params.limit !== undefined && params.limit > 0) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  /**
   * Count documents matching query
   */
  async countDocuments(params: {
    collection: string;
    query?: Record<string, any>;
  }): Promise<number> {
    const collection = this.getCollection(params.collection);
    
    let count = 0;
    for (const doc of collection.values()) {
      if (this.matchesQuery(doc, params.query || {})) {
        count++;
      }
    }

    return count;
  }

  /**
   * Execute aggregation pipeline (simplified)
   */
  async aggregate(params: {
    collection: string;
    pipeline: any[];
  }): Promise<any[]> {
    const collection = this.getCollection(params.collection);
    let results: any[] = Array.from(collection.values());

    for (const stage of params.pipeline) {
      const operator = Object.keys(stage)[0];
      const operatorValue = stage[operator];

      switch (operator) {
        case '$match':
          results = results.filter(doc => this.matchesQuery(doc, operatorValue));
          break;
        case '$project':
          results = results.map(doc => {
            const projected: any = {};
            for (const [field, include] of Object.entries(operatorValue)) {
              if (include) {
                projected[field] = doc[field];
              }
            }
            return projected;
          });
          break;
        case '$limit':
          results = results.slice(0, operatorValue);
          break;
        case '$skip':
          results = results.slice(operatorValue);
          break;
        case '$sort':
          const sortArray = Object.entries(operatorValue).map(([field, order]) => ({
            field,
            order: order as 1 | -1
          }));
          results = this.sortDocuments(results, sortArray);
          break;
      }
    }

    return results;
  }

  /**
   * Insert a single document
   */
  async insertOne(params: {
    collection: string;
    document: Record<string, any>;
  }): Promise<{ insertedId: string }> {
    const collection = this.getCollection(params.collection);
    const id = params.document._id || this.generateId();
    const doc = { ...params.document, _id: id };
    
    collection.set(id, doc);

    return { insertedId: id };
  }

  /**
   * Insert multiple documents
   */
  async insertMany(params: {
    collection: string;
    documents: Array<Record<string, any>>;
  }): Promise<{ insertedIds: string[]; insertedCount: number }> {
    const collection = this.getCollection(params.collection);
    const insertedIds: string[] = [];

    for (const document of params.documents) {
      const id = document._id || this.generateId();
      const doc = { ...document, _id: id };
      collection.set(id, doc);
      insertedIds.push(id);
    }

    return {
      insertedIds,
      insertedCount: insertedIds.length
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
    const collection = this.getCollection(params.collection);
    
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        const updated = this.applyUpdate(doc, params.update);
        collection.set(id, updated);
        return { matchedCount: 1, modifiedCount: 1 };
      }
    }

    if (params.upsert) {
      const id = this.generateId();
      const newDoc = this.applyUpdate({ _id: id, ...params.query }, params.update);
      collection.set(id, newDoc);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: id };
    }

    return { matchedCount: 0, modifiedCount: 0 };
  }

  /**
   * Update multiple documents
   */
  async updateMany(params: {
    collection: string;
    query: Record<string, any>;
    update: Record<string, any>;
  }): Promise<{ matchedCount: number; modifiedCount: number }> {
    const collection = this.getCollection(params.collection);
    let matchedCount = 0;
    let modifiedCount = 0;

    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        matchedCount++;
        const updated = this.applyUpdate(doc, params.update);
        collection.set(id, updated);
        modifiedCount++;
      }
    }

    return { matchedCount, modifiedCount };
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
    const collection = this.getCollection(params.collection);
    
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        collection.set(id, { ...params.replacement, _id: id });
        return { matchedCount: 1, modifiedCount: 1 };
      }
    }

    if (params.upsert) {
      const id = this.generateId();
      collection.set(id, { ...params.replacement, _id: id });
      return { matchedCount: 0, modifiedCount: 0, upsertedId: id };
    }

    return { matchedCount: 0, modifiedCount: 0 };
  }

  /**
   * Delete a single document
   */
  async deleteOne(params: {
    collection: string;
    query: Record<string, any>;
  }): Promise<{ deletedCount: number }> {
    const collection = this.getCollection(params.collection);
    
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        collection.delete(id);
        return { deletedCount: 1 };
      }
    }

    return { deletedCount: 0 };
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(params: {
    collection: string;
    query: Record<string, any>;
  }): Promise<{ deletedCount: number }> {
    const collection = this.getCollection(params.collection);
    let deletedCount = 0;

    const idsToDelete: string[] = [];
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        idsToDelete.push(id);
      }
    }

    for (const id of idsToDelete) {
      collection.delete(id);
      deletedCount++;
    }

    return { deletedCount };
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
    const collection = this.getCollection(params.collection);
    
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        const before = { ...doc };
        const after = this.applyUpdate(doc, params.update);
        collection.set(id, after);
        return params.returnDocument === 'after' ? after : before;
      }
    }

    if (params.upsert) {
      const id = this.generateId();
      const newDoc = this.applyUpdate({ _id: id, ...params.query }, params.update);
      collection.set(id, newDoc);
      return params.returnDocument === 'after' ? newDoc : null;
    }

    return null;
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
    const collection = this.getCollection(params.collection);
    
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        const before = { ...doc };
        const after = { ...params.replacement, _id: id };
        collection.set(id, after);
        return params.returnDocument === 'after' ? after : before;
      }
    }

    if (params.upsert) {
      const id = this.generateId();
      const newDoc = { ...params.replacement, _id: id };
      collection.set(id, newDoc);
      return params.returnDocument === 'after' ? newDoc : null;
    }

    return null;
  }

  /**
   * Find one document and delete it
   */
  async findOneAndDelete(params: {
    collection: string;
    query: Record<string, any>;
  }): Promise<any> {
    const collection = this.getCollection(params.collection);
    
    for (const [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, params.query)) {
        collection.delete(id);
        return doc;
      }
    }

    return null;
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
    let insertedCount = 0;
    let modifiedCount = 0;
    let deletedCount = 0;

    for (const op of params.operations) {
      switch (op.type) {
        case 'insertOne':
          await this.insertOne({ collection: params.collection, document: op.document! });
          insertedCount++;
          break;
        case 'updateOne':
          const updateOneResult = await this.updateOne({
            collection: params.collection,
            query: op.query!,
            update: op.update!
          });
          modifiedCount += updateOneResult.modifiedCount;
          break;
        case 'updateMany':
          const updateManyResult = await this.updateMany({
            collection: params.collection,
            query: op.query!,
            update: op.update!
          });
          modifiedCount += updateManyResult.modifiedCount;
          break;
        case 'deleteOne':
          const deleteOneResult = await this.deleteOne({
            collection: params.collection,
            query: op.query!
          });
          deletedCount += deleteOneResult.deletedCount;
          break;
        case 'deleteMany':
          const deleteManyResult = await this.deleteMany({
            collection: params.collection,
            query: op.query!
          });
          deletedCount += deleteManyResult.deletedCount;
          break;
        case 'replaceOne':
          const replaceOneResult = await this.replaceOne({
            collection: params.collection,
            query: op.query!,
            replacement: op.document!
          });
          modifiedCount += replaceOneResult.modifiedCount;
          break;
      }
    }

    return { insertedCount, modifiedCount, deletedCount };
  }

  /**
   * Clear all collections (useful for testing)
   */
  clearAll(): void {
    this.collections.clear();
    this.idCounter = 1;
  }

  /**
   * Clear a specific collection (useful for testing)
   */
  clearCollection(name: string): void {
    this.collections.delete(name);
  }
}
