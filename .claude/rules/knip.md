---
paths:
  - "knip.ts"
  - "**/package.json"
  - "**/package-lock.json"
---

# Knip の方針

## 目的

Knip の設定と Knip 指摘への対応は、issue 数を減らして CI を通す作業ではなく、実際の実行経路・module graph・モジュールの責務・テスト境界を正しくモデル化するための調査結果として扱う。検出結果を信頼できる状態にしてから、不要なファイル・export・依存関係を削除する。

- Knip がグリーンになったことだけを完了条件にしない。関連するテスト・typecheck・lint と、通常モード・`--production --strict` の両方の結果を確認する。
- `ignore*`、不要な `entry` 追加、`project` 範囲の拡大、テストのためだけの `export` 追加、テスト削除、アサーションの弱体化で issue を隠さない。

## このリポジトリの Knip 構成

対象は Knip v6。設定はリポジトリ直下の `knip.ts`（`KnipConfig` 型）に置き、各 `entry` / `ignore` の一次的な根拠は `knip.ts` 内のコメントに残す。設定の現状は `knip.ts` を参照し、この節は列挙ではなく背景と判断基準だけを補足する。

- **npm workspaces ではない。** root の `package.json` に `workspaces` フィールドはなく、各パッケージディレクトリが独自の `package-lock.json` を持ち個別に `npm ci` される。`knip.ts` の `workspaces` は、この独立したパッケージ群を Knip の解析単位として明示的に与えるためにある。
- **CI ゲート。** `.github/workflows/pr-ci-gate.yml` の `knip` ジョブが、対象 workspace × `{通常, production}` で `npx knip` と `--production --strict` を実行し、`--reporter github-actions` で PR を必須ブロックする。両モードが gate なので、ローカルでも `npm run knip` と `npm run knip:production` の両方を確認する。`treatConfigHintsAsErrors: true` で configuration hint も CI 失敗条件にする。
- **CDK と `tsx`。** CDK を持つ workspace では `tsx` が `cdk.json` の `"app"` から起動され `package.json` の scripts 経由ではないため、Knip の plugin 自動検出が実行経路を認識できない。これを補う `entry` の明示と `ignoreDependencies: ["tsx"]` が必要になる（末尾 `!` は production mode でも有効にする指定）。
- テスト専用ディレクトリ（共有 fixture / builder / factory / mock / fake を置く `src/test-support/**` など）は `project` の対象に含めつつ末尾 `!` で production mode のみ除外し、`ignore` では外さない。詳細は「テスト対象とテスト支援コードの境界」に従う。

## entry と project

`entry` と `project` は `ignore` より先に設計する。まず Knip のデフォルトと有効な plugin が追加する `entry` を `--debug` で確認し、追加設定は不足がある場合だけにする。

- `entry`: import graph の外側から実行される入口（アプリ起動ファイル、CLI、設定ファイル、生成スクリプト、HTML、動的 import、`buildEnd` などの hook から到達するファイル）。未使用 `export` の警告を消す目的で通常の module を `entry` に足さない。plugin や package script が同じ入口を追加していないか確認する（二重指定は redundant entry の configuration hint になる）。
- `project`: その workspace に属する解析対象ソースの範囲。build output・generated artifact・fixture は先頭 `!` の negated pattern で除外する。plugin が追加する test entry の除外や issue 抑制に `project` の negation を使わない。glob が意図したファイルに一致すること、redundant / no-match pattern を残さないことを確認する。
- production mode でだけ範囲を変えるときは末尾 `!`（例: `bin/**/*.ts!` は通常・production 両方の対象、`!src/test-support/**!` は production mode でのみ除外）。先頭 `!`（negation）と末尾 `!`（production 限定）を混同しない。
- `entry` ファイルの未使用 `export` はデフォルトで報告されない。private package で `entry` 内の `export` も検査したい場合だけ `includeEntryExports` を検討する。
- pattern は workspace root からの相対パスで書く。

## 通常モードと production mode

- 通常モード（`knip`）は production code に加えて test・設定ファイルなどの開発経路も解析する。
- production mode（`knip --production --strict`）は本番同梱コードに対象を絞る。test を外すために `ignore` や negated `project` を使わず、production mode を使う（test は plugin により `entry` になる）。
- CI では両モードを実行し、それぞれの目的を分ける。

## 指摘を修正するときの手順

各 issue について「実際に不要」か「実行経路が Knip から見えていない」かの反証可能な仮説を立て、安価なチェックで確認・否定してから編集する。上流から順に、1 つの設計単位ずつ扱う。

1. **configuration hint**: 設定の不足・冗長・no-match を先に解消する（`treatConfigHintsAsErrors` で CI 失敗条件にする）。
2. **`files`（未使用ファイル）**: ファイル単位の原因を解消する。未使用ファイルはその中の `export`・依存の検出にも影響するため、下流の issue だけを ignore しない。
3. **`unresolved`**: import、path alias、動的 import、生成物の扱いを正す。
4. **`exports` / `types`**: 不要な `export`・型を削除する。実装詳細を公開するだけの `export` を足さない。
5. **`dependencies` / `unlisted` / `binaries`**: 直接利用する依存を該当パッケージの `package.json` に宣言する。`unlisted binaries` はバイナリを提供する package を追加し、OS 等が提供すると根拠がある場合だけ `ignoreBinaries` を検討する。`ignoreDependencies` に足して終わりにしない。

各 issue が次のどれに当たるかを明示してから直す。

- 実際に不要 → 削除する。
- 実行経路はあるが `entry` / `project` / plugin / 生成処理 / path 設定での表現が不足 → 表現を足す。`entry` 追加だけでなく、静的な registry や明示的なモジュール境界への変更も検討する。
- 動的 import・自動登録・暗黙のファイル検出で module graph が不明確 → 静的に列挙できる形へ変える。
- モジュールの責務・公開 API・workspace 間の依存方向の問題 → 利用側・型・設定・テストを含めた完成した変更にする。
- テストが内部実装を直接参照している → 公開された振る舞いを検証する境界へ移す。

生成ファイルが絡む issue は、先に build / 生成を実行してから Knip を実行する。plugin の未対応・不完全が原因なら、plugin の設定・更新・修正を先に検討し、`entry` 追加や `ignore` は限定的な回避策とする。

## モジュール境界とテスト境界

- 本番コードを削除するときは、その振る舞い自体を廃止するのか、別モジュールへ移すのかを判断する。振る舞いを残すなら、対応するテストを削除せず変更後の公開境界へ移す。
- テストが内部実装を import していることは、テスト削除の根拠にならない。必要な契約テストを公開境界に置く。
- テストの期待値を変えるときは、Knip ではなく仕様・公開契約の変更が根拠であることを示す。外部から観測可能な振る舞いが変わるなら、リファクタリングではなく振る舞い変更として扱う。

## ignore は最後の手段

`ignore*` を使う前に、`entry` / `project` / plugin / 生成処理 / ソース修正で解消できないか確認する。使う場合は issue の種類に応じて最も狭い設定を選ぶ。

- `ignoreFiles`（未使用ファイル検出のみ）
- `ignoreIssues`（ファイルパターン単位で issue 種別を無視）
- `ignoreDependencies` / `ignoreBinaries` / `ignoreUnresolved` / `ignoreMembers`
- `ignoreWorkspaces`（解析対象から外す理由を確認してから）
- `ignore`（対象ファイルの全 issue 種別。最も広いので最後）

正当な `ignore*` は、実際に必要で、かつ生成物・外部設定・条件分岐・未対応 plugin などの理由で Knip が追跡できないものに限る。使ったら、対象 issue・根本対応できない理由・見直し条件を `knip.ts` のコメントまたは PR に明記する。

## 検証

- 通常モードと `--production --strict` の両方。必要なら `--debug` で workspace / `entry` / `project` / plugin / resolved files を確認する。
- `files` → `unresolved` → `exports` / `types` → `dependencies` の順に確認する。
- 関連する対象テスト・typecheck・lint を実行する。
- `package.json` を変更したら、直接依存としての宣言と、該当パッケージディレクトリでの `package-lock.json` 更新を確認する。
- 設定変更で issue を隠していないことを確認する。

## zero config から外れる場合

zero config で扱えないことを、直ちに設計不備と断定しない。生成ファイル、動的 import、HTML や外部サービスからの参照、未対応・不完全な plugin など、Knip の制約や実行時の性質による場合もある。ただし、同種の外部 `entry` を多数列挙する、`ignoreDependencies` が増え続ける、暗黙の自動登録や実行時の動的 import に依存する、workspace 間の相対 import で依存方向が不明確になる、通常の module を `entry` にしないと公開 API を検査できない、テストが内部実装を参照し続ける、といった兆候が複数あるときは、設定追加で終わらせず、確認できた事実・設計上の懸念・保守や検出精度への影響・選択肢（現構造 + 限定的な設定 / `entry`・registry・package 境界・テスト境界の再設計）を分けてユーザーに提示する。外部から観測可能な振る舞い・依存方向・公開 API に影響する設計変更は、ユーザーの判断を得てから行う。
