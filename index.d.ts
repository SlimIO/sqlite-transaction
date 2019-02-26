/// <reference types="@types/node" />
/// <reference types="sqlite" />

import * as sqlite from "sqlite";

declare class TransactionManager {
    constructor(db: sqlite.Database, options?: TransactionManager.ConstructorOptions)

    public verbose: boolean;
    public subjects: Map<string, TransactionManager.Actions>;
    public transactions: Map<string, TransactionManager.Transaction>;
    public timer: number;
    public readonly size: number;

    loadSubjectsFromFile(fileLocation: string): Promise<void>;
    registerSubject(name: TransactionManager.Subject, actions: TransactionManager.Actions): this;
    open(action: string, subject: TransactionManager.Subject, data: any[]): string;
    attachData(transactId: string, data: any): boolean;
    close(transactId: string): boolean;
    exit(): void;
}

declare namespace TransactionManager {
    type Database = sqlite.Database;
    type Subject = string | symbol;

    interface ConstructorOptions {
        interval?: number;
        verbose?: boolean;
    }

    interface Actions {
        insert?: string;
        delete?: string;
        update?: string;
    }

    interface Transaction {
        index: number;
        action: Actions;
        subject: Subject;
        openAt: number;
        attachData?: any;
        data: any[];
    }
}

export as namespace TransactionManager;
export = TransactionManager;
