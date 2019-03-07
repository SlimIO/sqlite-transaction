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
<details><summary>constructor(db: sqlite.Database, options?: TransactionManager.ConstructorOptions)</summary>
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

## License
MIT
