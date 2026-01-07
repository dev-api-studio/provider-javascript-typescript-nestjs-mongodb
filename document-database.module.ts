import { Module, DynamicModule, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseDocumentDatabase } from './MongooseDocumentDatabase';
import { FakeMemoryDocumentDatabase } from './FakeMemoryDocumentDatabase';

export const DOCUMENT_DATABASE_TOKEN = 'DOCUMENT_DATABASE';

export interface DocumentDatabaseModuleOptions {
  /**
   * Use fake in-memory database for testing
   * @default false
   */
  useFake?: boolean;

  /**
   * MongoDB connection URI (required if useFake is false)
   */
  mongoUri?: string;

  /**
   * MongoDB connection options
   */
  mongoOptions?: Record<string, any>;
}

/**
 * Document Database Module for NestJS
 * 
 * Provides document database functionality using either:
 * - MongooseDocumentDatabase (production) - requires MongoDB connection
 * - FakeMemoryDocumentDatabase (testing) - in-memory simulation
 * 
 * @example
 * // Production with MongoDB
 * DocumentDatabaseModule.forRoot({
 *   mongoUri: 'mongodb://localhost:27017/mydb'
 * })
 * 
 * @example
 * // Testing with fake in-memory database
 * DocumentDatabaseModule.forRoot({
 *   useFake: true
 * })
 */
@Module({})
export class DocumentDatabaseModule {
  static forRoot(options: DocumentDatabaseModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [];

    // Determine which implementation to use
    if (options.useFake) {
      // Use fake in-memory database for testing
      providers.push({
        provide: DOCUMENT_DATABASE_TOKEN,
        useClass: FakeMemoryDocumentDatabase
      });
    } else {
      // Use real Mongoose database
      if (!options.mongoUri) {
        throw new Error('mongoUri is required when useFake is false');
      }

      providers.push({
        provide: DOCUMENT_DATABASE_TOKEN,
        useClass: MongooseDocumentDatabase
      });
    }

    const imports = [];
    if (!options.useFake && options.mongoUri) {
      imports.push(
        MongooseModule.forRoot(options.mongoUri, options.mongoOptions)
      );
    }

    return {
      module: DocumentDatabaseModule,
      imports,
      providers,
      exports: [DOCUMENT_DATABASE_TOKEN]
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<DocumentDatabaseModuleOptions> | DocumentDatabaseModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'DOCUMENT_DATABASE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || []
      },
      {
        provide: DOCUMENT_DATABASE_TOKEN,
        useFactory: async (moduleOptions: DocumentDatabaseModuleOptions) => {
          if (moduleOptions.useFake) {
            return new FakeMemoryDocumentDatabase();
          } else {
            // For async, MongooseDocumentDatabase will be injected via DI
            return MongooseDocumentDatabase;
          }
        },
        inject: ['DOCUMENT_DATABASE_OPTIONS']
      }
    ];

    return {
      module: DocumentDatabaseModule,
      providers,
      exports: [DOCUMENT_DATABASE_TOKEN]
    };
  }
}
