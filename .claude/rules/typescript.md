---
paths:
  - "**/*.{ts,tsx}"
---

# TypeScript の型設計指針

- **プリミティブ型の意味を型で区別する**: `string`や`number`のままだと取り違えが起きる概念(リソース名、ARN、アカウントID、リージョンなど)は、Branded Type(`unique symbol`を用いた公称型)で区別し、生成はバリデーション付きのスマートコンストラクタに限定すること。
- **構造的型付けの限界を意識する**: TypeScript は構造的型付けのため、`Pick`で一部フィールドだけ抜き出した型には元の完全な型もそのまま代入できてしまう。意味の違いを型で保証したいときは Branded Type / Opaque Type を使うこと。
- **検証は境界で一度だけ行う(parse, don't validate)**: 外部入力(CDK context、環境変数、設定ファイルなど)は境界でパースし、以降の内部コードでは検証済みであることを型で保証すること。同じ検証を呼び出し側に繰り返させないこと。
- **Branded Type は外部入力から parse で復元する**: ブランドはコンパイル時のみの情報で、JSON 化や外部入力の復元で失われる。`JSON.parse(...) as BrandedType`と直接 cast せず、検証付きの parse 関数を通してブランドを再付与すること。
- **`any`を避け、`unknown`を経由する**: 型が不明な入力は`any`ではなく`unknown`で受け取り、型述語(type predicate)や型ガードで絞り込んでから使用すること。
- **union型と網羅性チェックで分岐を保証する**: 状態や設定の分岐は判別可能なunion型(discriminated union)で表現し、`switch`文の`default`節で`never`に代入することで分岐漏れをコンパイルエラーにすること。
- **不変性をデフォルトにする**: 設定値やリソース定義は`readonly`修飾子や`as const`を基本とし、意図しない変更を型で防ぐこと。
- **標準ユーティリティ型で重複を避ける**: `Pick` / `Omit` / `Partial` / `ReturnType`などを活用し、既存の型と同じ形の型を手書きで重複定義しないこと。
- **`satisfies`で型推論を保ったまま制約を効かせる**: 定数オブジェクトなどはリテラル型を広げる`as`よりも`satisfies`を優先し、型チェックとリテラル型推論を両立させること。
- **エラーも型で表現する**: 想定内の失敗はカスタムエラークラスで表現し、`cause`を使って元エラーとの連鎖を保つこと。想定外の分岐は握りつぶさず型または例外として顕在化させること。

# tsconfig

- 新規の`tsconfig`は`strict: true`から始めること。`strict`は strict mode family(`useUnknownInCatchVariables` / `strictPropertyInitialization`など)をまとめて有効化するので、これらを個別に重複指定しないこと。
- `strict`に含まれない追加チェック(`noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` / `noImplicitOverride` / `noImplicitReturns` / `noFallthroughCasesInSwitch`)は、依存ライブラリとの互換を確認したうえで原則有効化すること。特に`exactOptionalPropertyTypes`は`property?: T`と`property: undefined`を区別するため互換確認が要る。
- 未使用コード検査(`noUnusedLocals` / `noUnusedParameters`)は Knip と責務が重なる。どちらで担保するかを決めて設定し、テストコードへの影響も確認すること。
- `skipLibCheck: true`は型定義の検査を省いて正確性を下げる。安易に付けず、依存の解決や型定義の統一で解消できないか先に確認すること。設定を緩める場合は理由を設定の近くにコメントで残すこと。
- 既存ファイルの緩い設定をそのままコピーしないこと。対象の実行環境・出力方式・依存を確認して決めること。
- モジュール解決は実行環境で選ぶこと。Node が直接実行するコードは`module` / `moduleResolution`を`nodenext`、バンドラ(Vite など)経由のコードは`preserve` / `bundler`にする。
- 素の transpile や Node のネイティブ型ストリップに載せる階層では`erasableSyntaxOnly`を有効にし、`enum` / `namespace` / パラメータプロパティを使わないこと。

# モジュール構文

- `verbatimModuleSyntax`を前提に、型だけの import / export は`import type` / `export type`と明示すること。値と型を同じ`import`文に混ぜないこと。

# 標準的な型定義のスタイル(公式 Do's and Don'ts)

- ボックス型(`Number` / `String` / `Boolean` / `Object`)を使わないこと。プリミティブ(`number`など)を使う。`Function`型も使わず、具体的なシグネチャを書くこと。
- 戻り値を使わないコールバックの型は`() => void`にすること(`() => any`にしない)。コールバックの引数を不用意に optional にしないこと。
- オーバーロードより union 型や optional パラメータを優先すること。どうしてもオーバーロードを書く場合は、具体的なシグネチャを一般的なものより前に置くこと(最初にマッチした定義が選ばれる)。
- ジェネリクスは、型引数が 2 箇所以上の関係を表すときだけ使うこと。1 箇所にしか現れない型引数は意味がない。

# TypeScript 7(ネイティブ移植版)

- 型エラーと生成される JS は 6 系と同一(Go 実装で高速化しただけ)。移行にあたって書き方を変える必要は基本ない。
- `strict`と 6.0 で非推奨になった項目がハードデフォルトになっている。`strict: false`前提のコードは通らない。
- 7.0 時点では安定した programmatic API が無い(7.1 待ち)。tsc を API 経由で使うツールに注意すること。
