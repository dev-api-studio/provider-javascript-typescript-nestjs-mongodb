/**
 * NestJS Document Database Provider
 * 
 * Exports:
 * - MongooseDocumentDatabase: Production implementation using Mongoose
 * - FakeMemoryDocumentDatabase: In-memory implementation for testing
 * - DocumentDatabaseModule: NestJS module for dependency injection
 * - DOCUMENT_DATABASE_TOKEN: Injection token
 */

export { MongooseDocumentDatabase } from './MongooseDocumentDatabase';
export { FakeMemoryDocumentDatabase } from './FakeMemoryDocumentDatabase';
export { DocumentDatabaseModule, DOCUMENT_DATABASE_TOKEN } from './document-database.module';
export type { DocumentDatabaseModuleOptions } from './document-database.module';
