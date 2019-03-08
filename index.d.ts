/// <reference types="@types/node" />
/// <reference types="sqlite" />

import * as sqlite from "sqlite";

declare class TransactionManager<S> {
    constructor(db: sqlite.Database, options?: TransactionManager.ConstructorOptions)

    public verbose: boolean;
    public subjects: Map<string, TransactionManager.Actions>;
    public transactions: Map<string, TransactionManager.Transaction>;
    public timer: number;
    public readonly size: number;

    loadSubjectsFromFile(fileLocation: string): Promise<void>;
    registerSubject(name: TransactionManager.Subject, actions: TransactionManager.Actions): this;
    open<T extends keyof S>(action: TransactionManager.Action, subject: T, data: S[T]): string;
    attachData(transactId: string, data: any): boolean;
    close(transactId: string): boolean;
    exit(): void;
}

declare namespace TransactionManager {
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

    type Database = sqlite.Database;
    type Subject = string | symbol;
    type Action = keyof Actions;
}

export as namespace TransactionManager;
export = TransactionManager;
