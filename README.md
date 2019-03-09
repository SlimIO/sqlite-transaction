# sqlite-transaction
![version](https://img.shields.io/badge/version-0.1.0-blue.svg)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)

SQLite transaction manager for SlimIO events addon. Designed to work with the [sqlite](https://github.com/kriasoft/node-sqlite#readme) npm package.

## Requirements
- Node.js v10 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @slimio/sqlite-transaction
# or
$ yarn add @slimio/sqlite-transaction
```

## Usage example
Take the following example with an SQLite DB (with a table `users`).
```js
const tM = new TransactionManager(db, {
    interval: 500,
    verbose: true
});
tM.registerSubject("user", {
    insert: "INSERT INTO users (username, password) VALUES (?, ?)"
});

tM.once("user.insert", (openAt, data, aData) => {
    console.log(`User insertion requested at: ${new Date(openAt)}, now successfully inserted!`);
});

const tId = tM.open("insert", "user", ["fraxken", "admin"]);
const ret = tM.attachData(tId, { foo: "bar" });
```

## API
<details><summary>constructor< S >(db: sqlite.Database, options?: TransactionManager.ConstructorOptions)</summary>
<br />

Create a new SQLite transaction manager. The first argument must be an SQLite db (from the npm package [sqlite](https://github.com/kriasoft/node-sqlite#readme)). Available options are described by the following interface:
```ts
interface ConstructorOptions {
    interval?: number;
    verbose?: boolean;
}
```

Default values are interval `5000` (milliseconds) and verbose `false`.

```js
const sqlite = require("sqlite");
const transactionManager = require("@slimio/sqlite-transaction");

const db = await sqlite.open("./db.sqlite");
const tM = new transactionManager(db, { interval: 1000 });
```
</details>

<details><summary>registerSubject(name: TransactionManager.Subject, actions: TransactionManager.Actions): this</summary>
<br />

Register a new Subject on the Transaction Manager object. The subject name must be typeof string or symbol. The actions argument must be described by a JavaScript Object as follow:
```ts
interface Actions {
    insert?: string;
    delete?: string;
    update?: string;
}
```

```js
tM.registerSubject("test", {
    update: "...",
    delete: "..."
});
```
</details>

<details><summary>loadSubjectsFromFile(fileLocation: string): Promise< void ></summary>
<br />

Load subjects from a given **.json** file. The file must be indented as follow:
```json
{
    "subjectName": {
        "insert": "INSERT INTO table (field) VALUES ('val')",
        "update": "..."
    }
}
```

Example
```js
await tM.loadSubjectsFromFile("./subjects.json");
```
</details>

<details><summary>open(action: TransactionManager.Action, subject: keyof S, data: any[]): string</summary>
<br />

Open a new request that will be queue and handled in a SQLite transaction. **action** and **subject** arguments are not mandatory and must be valid. Action must be either **insert**, **update** or **delete**.

The action must exist on the given subject.
</details>

<details><summary>attachData(transactId: string, data: any): boolean</summary>
<br />

</details>

<details><summary>close(transactId: string): boolean</summary>
<br />

</details>

<details><summary>exit(): void</summary>
<br />

</details>

## Roadmap
- Ability to lock/unlock requests (db handle priority).
- Reduce/Agregate same requests (alarm with row occurence for example).

## License
MIT
