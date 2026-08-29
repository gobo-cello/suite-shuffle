# suite-shuffle

Suite Shuffleのアプリケーション・コンテンツ・ワークロード用インフラを管理するリポジトリ。

## このリポジトリで管理するもの

- Suite Shuffleのアプリケーションコード
- Suite Shuffleの本番(`suite-shuffle-production`)・検証(`suite-shuffle-sandbox`)ワークロード用 Infrastructure as Code(`infra/`)
- Suite Shuffleのデプロイに関する GitHub Actions と AWS の OIDC 連携

## このリポジトリで管理しないもの

- AWS Organizations、Management accountの設定
- CloudTrailログの一元管理、IAM Access Analyzerなど組織横断の監査・セキュリティ基盤
- Service Control Policy
- AWSルートユーザーの認証情報
- IAM Identity Centerのユーザー
- 連絡先メールアドレス
- ドメインレジストラの認証情報
- シークレットおよびAPIキー
- apex hosted zone(`aws-platform`リポジトリが所有)。Suite Shuffle 用サブドメインの hosted zone はこのリポジトリで作成し、apex からの NS 委譲で連携する(詳細は`aws-platform`リポジトリの`docs/adr/0005-dns-delegation.md`)

組織レベルの共通基盤は、別のInfrastructure as Codeリポジトリ(`aws-platform`)で管理する。このリポジトリは、そのリポジトリが提供するアカウント構成やログ基盤を前提として、Suite Shuffle固有のワークロードだけを扱う。

## ディレクトリ構成と主要コマンド

各ディレクトリは独立した`package.json`を持つ。ルートには Biome / Knip / lefthook の設定だけがある。

- `app/`: Suite Shuffle 本体(Vite + React)。`npm --prefix app run dev` / `run build` / `run test:unit` / `run test:dom`
- `infra/`: ワークロード用の CDK。`npm --prefix infra run build` / `test` / `run cdk synth` / `run cdk diff <stack...>`。エントリポイントは`infra/bin/infra.ts`で、ターゲット指定に関わらず全 stack を構築する
- `docs/`: ドキュメント。ADR は`docs/adr/`
- `scripts/`: 補助スクリプト(`actionlint.sh`など)
- ルート: `npm run check`(Biome、safe fix のみ) / `npm run knip` / `npm run knip:production`

## デプロイ

- デプロイは GitHub Actions(`.github/workflows/deploy.yml`)経由のみで行う。ローカルや手動での`cdk deploy`は行わない。
- `main`への push で`app/**`・`infra/**`などが変更されると起動し、`sandbox` → `production`の順に GitHub Environments へ OIDC でロールを引き受けてデプロイする。

## 品質確認と完了前チェック

- コードを変更したら、対象スタックの formatter / linter を実行すること。
  - JavaScript / TypeScript / JSON: ルートの Biome。`npm run check`(safe fix のみ)。`--unsafe`は自動では使わず、必要なときだけ手動で`npm run check:unsafe`を実行し、diff を確認すること。
  - GitHub Actions ワークフロー: `./scripts/actionlint.sh -color`
- 変更が`lefthook.yml`の`pre-push`対象(`infra`/`app`の build・test(`test:unit`・`test:dom`)、`cdk synth`、`knip`、`knip:production`、`actionlint`)に該当する場合は、作業完了前に該当チェックを実行し、通してから完了とすること。失敗した場合は原因を修正し、同じチェックを再実行すること。
- Knip は green にすることを目的にせず、「Knip 設定の方針」節と根本原因修正の手順に従うこと。通常モードと`--production --strict`の両方を確認すること。
- PR の CI(`.github/workflows/pr-ci-gate.yml`)は上記と同じチェックを実行する。ローカルで通してから push すること。

## コードのドメイン非依存の原則

- このリポジトリは特定の運用ドメインのために作られているが、このinstructionsファイルを含むソースコード・コメント・識別子(変数名、関数名、クラス名、リソース名、パッケージ名、スタック名など)には、運用中の実際のドメイン名を登場させないこと。
- ドメイン名に依存する値は、環境変数、GitHub Variables/Secrets、CDK context、設定ファイルなど、コード外の設定として注入すること。コード側はそれらを汎用的なパラメータとして受け取るように書くこと。
- 理由: 別ドメイン(別のTLDへの移行を含む)への切り替えや移管が発生しても、コードを変更せずに動作するようにするため。実装が特定ドメインの前提にハードコードされることを避ける。

## 公開リポジトリとしての取り扱い

- このリポジトリの内容は、コード、設定、ドキュメント、Issue、Pull Requestを含め、第三者から閲覧される前提で扱うこと。
- 認証情報、シークレット、個人情報、連絡先、公開不要な環境固有情報を、コード、設定、ログ、コメント、サンプルへ含めないこと。
- AWSへの認証にはOIDCと一時認証情報を使用し、長期的なアクセスキーを使用しないこと。
- 実値が不要な箇所では、環境変数、GitHub Variables、または明らかなダミー値を使用すること。
- GitHub Actionsは必要最小限の権限で実行し、外部Actionはコミット SHAで固定すること。
- 秘密情報が公開された可能性がある場合は、履歴の修正だけで済ませず、直ちに無効化またはローテーションすること。

## Git とコミットの共有運用

- 作業開始時は最新の`main`を取り込み、作業ブランチは最新の`main`から作成すること。
- ブランチ名は作業内容が分かるものにすること。チーム運用上の識別子がある場合は必要に応じて含めること。
- 意図しないブランチへのコミットを避け、同じ作業内容は同じ作業ブランチで継続すること。
- コミットは小さく、意味のある完成単位で行うこと。
- コミットメッセージはConventional Commitsに従い、`<type>(<scope>): <日本語の要約>`を基本とすること。

## リファクタリングの判定基準

- Martin Fowlerの定義を参考にし、このプロジェクトでは、リファクタリングを「外部から観測可能な振る舞いを変えずに、内部構造を改善する変更」として扱うこと。
- 振る舞いの変更を伴う場合、それを「リファクタリング」と表現しないこと。
- 次の変更を含む場合は、「振る舞い変更」または「機能変更」と明示し、リファクタリングとは別コミットに分けること。必要なら別PRに分けること。
  - APIのレスポンス内容、HTTPステータス、エラーメッセージの変更。
  - UIの表示内容、文言、操作フローの変更。
  - バリデーション条件の追加、削除、変更。
  - 外部仕様や業務上の意味を変更するDBスキーマ変更や永続化データ変更。
  - 既存機能の仕様変更。
  - 仕様変更を正当化するための、テスト期待値やシナリオの書き換え。

## Tidy First の原則

- Kent BeckのTidy First?の考え方を参考にし、構造変更と振る舞い変更を分離すること。
- 構造変更の例は、名前変更、重複除去、責務分離、型の整理、配置変更である。
- 振る舞い変更の例は、仕様変更、条件分岐の意味変更、入出力変更、画面表示変更である。
- 振る舞い変更のために必要な整理であっても、同じコミットに混ぜないこと。
- 構造変更を先に行う場合でも、各コミットは常にテストが通る完成状態にすること。
- 1つのコミットには、1つの論理的なtidyだけを含めること。
- 1つのPRにも、原則として1つの目的に関わるtidyだけを含めること。複数のtidyが必要なら、別コミットまたは別PRに分けること。

## 小さなリファクタの原則

- 小さなリファクタは、未完成状態を分割するのではなく、完成した改善を小さく積むこと。
- 各ステップは単体で意味を持ち、完成状態で、merge可能かつrevert可能であること。
- 未使用の関数・型・抽象化・dead codeを、中間状態として先行追加しないこと。

## テスト対象とテスト支援コードの境界

- プロダクションコードの関数、型、定数を、テストから直接参照することだけを目的として`export`しないこと。
- テストは原則として、モジュールやコンポーネントが公開する契約と、外部から観測可能な振る舞いを通じて行うこと。
- 実装詳細への直接依存は、外部から観測可能な振る舞いを変えないリファクタリングでもテストを壊しやすくするため避けること。
- テストからしか参照されない`export`が見つかった場合は、安易にKnipの除外設定へ追加せず、次の順で設計を見直すこと。
  1. 既存の公開APIを通じて振る舞いを検証できないか。
  2. テストが実装詳細に依存していないか。
  3. 対象処理が独立した責務やドメイン概念を持つなら、別モジュールとして切り出すべきではないか。
  4. 時刻、乱数、通信などの外部依存が原因なら、依存注入によって境界を明示できないか。
- テストが存在しなくても公開APIとして成立するものは、独立したモジュールから`export`してよい。テストの存在だけを理由に可視性を広げないこと。
- 複数のテストで共有するfixture、builder、factory、mock、fakeなどが増えた場合は、`test-support/`などのテスト専用ディレクトリへ分離すること。
- `test-support/`はプロダクションコードから参照せず、プロダクションコードの内部実装を公開するためにも使用しないこと。
- `test-support/`を未使用コード検査から一律に除外しないこと。通常のKnip解析では未使用コードを検査し、production解析では出荷コードではないものとして扱うこと。
- `@internal`や`__testOnly`などを付けて、テストのためだけにプロダクションモジュールの内部実装を`export`することは原則として行わないこと。
- テストから内部実装を直接参照する必要が生じた場合は、まず公開API経由のテスト、責務の分離、独立したモジュールへの切り出し、依存注入などの設計変更で解消すること。
- `@internal`やテスト専用`export`は、設計変更では合理的に解消できない場合の最後の手段とすること。使用する場合は、その理由と将来解消する条件をコメントまたはPRに明示すること。

## テストの記述方針

- テストは実装の確認ではなく、外部から観測可能な振る舞いを記述した仕様書として読むことができるように書くこと。
- テスト名は実装手段ではなく、利用者から観測できる結果を記述すること。
- テスト実行結果だけを読んでも仕様が理解できるよう、テスト対象・前提条件・期待する振る舞いが`describe`と`it`で自然に読める構成にすること。
- 振る舞いを仕様として記述するテストでは、原則として`it`を使用すること。
- 独立したテストケースやデータ駆動テストとして表現した方が自然な場合は、`test`を使用してよい。
- 同一のテストスイート内で、意図なく`it`と`test`を混在させないこと。
- Playwright (@playwright/test) を使うe2eテストは、フレームワークが`it`を提供しないため`test`を使用する

## テスト実行環境の使い分け

- DOM環境(jsdom/happy-domなど)を使うテストは、環境構築のオーバーヘッドによりnode環境のテストより実行が遅い。node環境で成立するテストはDOM環境に寄せず、node環境のまま書くこと。
- ロジックをDOM/ブラウザAPIから分離できる場合は分離し、node環境の単体テストで振る舞いを担保すること。たとえば`localStorage`のような外部APIは`Pick<Storage, ...>`のような最小限の型で受け取り、テストではin-memory fakeを注入することで、実際のDOM/ブラウザ実装を介さずに契約を検証する。
- DOM環境のテストは、レンダリング結果やイベント発火など、DOM APIを実際に介さなければ観測できない振る舞いに限定すること。ロジックの正しさをDOM環境のテストで検証しないこと。
- Reactコンポーネントを設計する際も、状態遷移や入出力の計算などのロジックを、コンポーネント本体(JSXを返す関数)やカスタムhookの内部に埋め込まず、独立した関数やカスタムhookとして分離すること。ロジックを分離すれば、その部分はnode環境の単体テストで担保でき、DOM環境のテストはレンダリング結果やユーザー操作の検証など、コンポーネントに残る薄い部分に限定できる。
- 新しいテストを追加する際は、まずnode環境で書けないかを検討し、DOM環境が必要な理由(何がDOM APIを実際に介さないと検証できないか)を説明できる場合に限りDOM環境のテストを追加すること。

## 環境変数を追加・変更する際に確認するファイル

- `infra/lib/config/environments.ts`・`infra/lib/config/dns.ts`など: 環境変数のparse処理
- `infra/.env.example`: ローカル開発用の一覧
- `.github/workflows/deploy.yml`: 全ての`cdk deploy`ステップのenv。`bin/infra.ts`はターゲットのstackに関わらず全stackを構築するため、「このstackはこの環境変数を使わないから不要」という判断はできない
- `.github/workflows/pr-ci-gate.yml`: `cdk-synth`・`cdk-diff`ジョブのenv

## GitHub Actions のバージョン固定

- ワークフロー(`.github/workflows/*.yml`)で使用するGitHub Actionsは、可変なタグ(`@v4`など)ではなく、固定されたコミットハッシュで指定すること。
- コミットハッシュの末尾に`# vX.Y.Z`の形式で、参照したタグのバージョンをコメントとして残すこと。
- 理由: タグは後から書き換え可能であり、意図しないコードが実行されるサプライチェーン攻撃のリスクがあるため。

## 守ってほしいこと

- **ベストプラクティスの優先**: 実装方針を提案する際は、特段の事情がない限り、公式推奨やベストプラクティスに従ってください。既存方針と異なる場合は、必要に応じて改善案として提案してください。
- **アンチパターンの回避**: 既知のアンチパターンは避け、必要に応じて改善案として提案してください。既存方針と異なる場合は、必要に応じて改善案として提案してください。
- **シンプルで進化可能な設計**: YAGNI・KISS・XPのSimple Designを意識し、現在の要件に対して必要十分で読みやすい実装を優先してください。ただし、保守性・拡張性・テスト容易性・責務の明確さを損なう過度な単純化は避けてください。
- **最新の公式ドキュメント重視**: ライブラリやフレームワークの使用方法については、最新の公式ドキュメントを参照して、推奨されるベストプラクティスに従ってください。

## TypeScript の型設計指針

- **プリミティブ型の意味を型で区別する**: `string`や`number`のままだと取り違えが起きる概念(リソース名、ARN、アカウントID、リージョンなど)は、Branded Type(`unique symbol`を用いた公称型)で区別し、生成はバリデーション付きのスマートコンストラクタに限定すること。
- **検証は境界で一度だけ行う(parse, don't validate)**: 外部入力(CDK context、環境変数、設定ファイルなど)は境界でパースし、以降の内部コードでは検証済みであることを型で保証すること。同じ検証を呼び出し側に繰り返させないこと。
- **`any`を避け、`unknown`を経由する**: 型が不明な入力は`any`ではなく`unknown`で受け取り、型述語(type predicate)や型ガードで絞り込んでから使用すること。
- **union型と網羅性チェックで分岐を保証する**: 状態や設定の分岐は判別可能なunion型(discriminated union)で表現し、`switch`文の`default`節で`never`に代入することで分岐漏れをコンパイルエラーにすること。
- **不変性をデフォルトにする**: 設定値やリソース定義は`readonly`修飾子や`as const`を基本とし、意図しない変更を型で防ぐこと。
- **標準ユーティリティ型で重複を避ける**: `Pick` / `Omit` / `Partial` / `ReturnType`などを活用し、既存の型と同じ形の型を手書きで重複定義しないこと。
- **`satisfies`で型推論を保ったまま制約を効かせる**: 定数オブジェクトなどはリテラル型を広げる`as`よりも`satisfies`を優先し、型チェックとリテラル型推論を両立させること。
- **エラーも型で表現する**: 想定内の失敗はカスタムエラークラスで表現し、`cause`を使って元エラーとの連鎖を保つこと。想定外の分岐は握りつぶさず型または例外として顕在化させること。

## Knip の方針

### 目的

Knip の設定と Knip 指摘への対応は、issue 数を減らして CI を通す作業ではなく、実際の実行経路・module graph・モジュールの責務・テスト境界を正しくモデル化するための調査結果として扱う。検出結果を信頼できる状態にしてから、不要なファイル・export・依存関係を削除する。

- Knip がグリーンになったことだけを完了条件にしない。関連するテスト・typecheck・lint と、通常モード・`--production --strict` の両方の結果を確認する。
- `ignore*`、不要な `entry` 追加、`project` 範囲の拡大、テストのためだけの `export` 追加、テスト削除、アサーションの弱体化で issue を隠さない。

### このリポジトリの Knip 構成

対象は Knip v6。設定はリポジトリ直下の `knip.ts`（`KnipConfig` 型）に置き、各 `entry` / `ignore` の一次的な根拠は `knip.ts` 内のコメントに残す。設定の現状は `knip.ts` を参照し、この節は列挙ではなく背景と判断基準だけを補足する。

- **npm workspaces ではない。** root の `package.json` に `workspaces` フィールドはなく、各パッケージディレクトリが独自の `package-lock.json` を持ち個別に `npm ci` される。`knip.ts` の `workspaces` は、この独立したパッケージ群を Knip の解析単位として明示的に与えるためにある。
- **CI ゲート。** `.github/workflows/pr-ci-gate.yml` の `knip` ジョブが、対象 workspace × `{通常, production}` で `npx knip` と `--production --strict` を実行し、`--reporter github-actions` で PR を必須ブロックする。両モードが gate なので、ローカルでも `npm run knip` と `npm run knip:production` の両方を確認する。`treatConfigHintsAsErrors: true` で configuration hint も CI 失敗条件にする。
- **CDK と `tsx`。** CDK を持つ workspace では `tsx` が `cdk.json` の `"app"` から起動され `package.json` の scripts 経由ではないため、Knip の plugin 自動検出が実行経路を認識できない。これを補う `entry` の明示と `ignoreDependencies: ["tsx"]` が必要になる（末尾 `!` は production mode でも有効にする指定）。
- テスト専用ディレクトリ（共有 fixture / builder / factory / mock / fake を置く `src/test-support/**` など）は `project` の対象に含めつつ末尾 `!` で production mode のみ除外し、`ignore` では外さない。詳細は「テスト対象とテスト支援コードの境界」に従う。

### entry と project

`entry` と `project` は `ignore` より先に設計する。まず Knip のデフォルトと有効な plugin が追加する `entry` を `--debug` で確認し、追加設定は不足がある場合だけにする。

- `entry`: import graph の外側から実行される入口（アプリ起動ファイル、CLI、設定ファイル、生成スクリプト、HTML、動的 import、`buildEnd` などの hook から到達するファイル）。未使用 `export` の警告を消す目的で通常の module を `entry` に足さない。plugin や package script が同じ入口を追加していないか確認する（二重指定は redundant entry の configuration hint になる）。
- `project`: その workspace に属する解析対象ソースの範囲。build output・generated artifact・fixture は先頭 `!` の negated pattern で除外する。plugin が追加する test entry の除外や issue 抑制に `project` の negation を使わない。glob が意図したファイルに一致すること、redundant / no-match pattern を残さないことを確認する。
- production mode でだけ範囲を変えるときは末尾 `!`（例: `bin/**/*.ts!` は通常・production 両方の対象、`!src/test-support/**!` は production mode でのみ除外）。先頭 `!`（negation）と末尾 `!`（production 限定）を混同しない。
- `entry` ファイルの未使用 `export` はデフォルトで報告されない。private package で `entry` 内の `export` も検査したい場合だけ `includeEntryExports` を検討する。
- pattern は workspace root からの相対パスで書く。

### 通常モードと production mode

- 通常モード（`knip`）は production code に加えて test・設定ファイルなどの開発経路も解析する。
- production mode（`knip --production --strict`）は本番同梱コードに対象を絞る。test を外すために `ignore` や negated `project` を使わず、production mode を使う（test は plugin により `entry` になる）。
- CI では両モードを実行し、それぞれの目的を分ける。

### 指摘を修正するときの手順

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

### モジュール境界とテスト境界

- 本番コードを削除するときは、その振る舞い自体を廃止するのか、別モジュールへ移すのかを判断する。振る舞いを残すなら、対応するテストを削除せず変更後の公開境界へ移す。
- テストが内部実装を import していることは、テスト削除の根拠にならない。必要な契約テストを公開境界に置く。
- テストの期待値を変えるときは、Knip ではなく仕様・公開契約の変更が根拠であることを示す。外部から観測可能な振る舞いが変わるなら、リファクタリングではなく振る舞い変更として扱う。

### ignore は最後の手段

`ignore*` を使う前に、`entry` / `project` / plugin / 生成処理 / ソース修正で解消できないか確認する。使う場合は issue の種類に応じて最も狭い設定を選ぶ。

- `ignoreFiles`（未使用ファイル検出のみ）
- `ignoreIssues`（ファイルパターン単位で issue 種別を無視）
- `ignoreDependencies` / `ignoreBinaries` / `ignoreUnresolved` / `ignoreMembers`
- `ignoreWorkspaces`（解析対象から外す理由を確認してから）
- `ignore`（対象ファイルの全 issue 種別。最も広いので最後）

正当な `ignore*` は、実際に必要で、かつ生成物・外部設定・条件分岐・未対応 plugin などの理由で Knip が追跡できないものに限る。使ったら、対象 issue・根本対応できない理由・見直し条件を `knip.ts` のコメントまたは PR に明記する。

### 検証

- 通常モードと `--production --strict` の両方。必要なら `--debug` で workspace / `entry` / `project` / plugin / resolved files を確認する。
- `files` → `unresolved` → `exports` / `types` → `dependencies` の順に確認する。
- 関連する対象テスト・typecheck・lint を実行する。
- `package.json` を変更したら、直接依存としての宣言と、該当パッケージディレクトリでの `package-lock.json` 更新を確認する。
- 設定変更で issue を隠していないことを確認する。

### zero config から外れる場合

zero config で扱えないことを、直ちに設計不備と断定しない。生成ファイル、動的 import、HTML や外部サービスからの参照、未対応・不完全な plugin など、Knip の制約や実行時の性質による場合もある。ただし、同種の外部 `entry` を多数列挙する、`ignoreDependencies` が増え続ける、暗黙の自動登録や実行時の動的 import に依存する、workspace 間の相対 import で依存方向が不明確になる、通常の module を `entry` にしないと公開 API を検査できない、テストが内部実装を参照し続ける、といった兆候が複数あるときは、設定追加で終わらせず、確認できた事実・設計上の懸念・保守や検出精度への影響・選択肢（現構造 + 限定的な設定 / `entry`・registry・package 境界・テスト境界の再設計）を分けてユーザーに提示する。外部から観測可能な振る舞い・依存方向・公開 API に影響する設計変更は、ユーザーの判断を得てから行う。

## Biome 設定の方針

Biome の実行コマンド、safe / unsafe fix、CI での扱いは「品質確認と完了前チェック」節に従う。ここでは `biome.json` に何を入れ、何を入れないかの判断基準を定める。この節は「Knip 設定の方針」と同じ意図で、チェックを通すために設定でノイズを消すのではなく、実際の実行経路とプロジェクトの境界を正しくモデル化するために使う。

### 目的

Biome の設定は、CLI・エディター・CI が同じ品質基準を共有するためのプロジェクト方針として扱う。設定値を増やして個人の好みを細かく再現することではなく、可読性、問題の早期発見、安全な自動修正、意思決定コストの削減に寄与することを目的とする。

### 対象バージョンと構成

- Biome v2 を使う。`@biomejs/biome` は `package.json` の `devDependencies` で固定し、設定 schema と CLI の version を揃える。`latest` に依存して診断や整形結果を変動させない。gobo-cello の他リポジトリ(`aws-platform` / `blog` / `landing` / `suite-shuffle`)と version を揃え、片方だけ先行して結果が変わることを避ける。
- 設定はリポジトリ直下の `biome.json` 一つで、`infra/`・`app/` を含むリポジトリ全体をカバーする。各ディレクトリに本当に異なる責務・言語・ライフサイクルが生じない限り nested configuration(`extends: "//"` を含む)は置かない。設定の現状は `biome.json` を参照する。

### Formatter / Linter / Assist を分ける

- Formatter はレイアウトの一貫性を担当する意見の強いツールなので、書式の好みを設定項目の追加で再現しない。非デフォルトの formatter オプションは、既存標準との互換性や可読性など具体的な理由がある場合だけ採用する。
- Linter は誤り、危険な記述、不要な複雑さ、性能、セキュリティ、アクセシビリティなど、Formatter では扱わない品質問題を検出する。書式を Linter のルールで重ねて強制しない。
- Assist は常に修正を提案するアクションであり、バグ検出ではない。自動修正を採用する対象、エディターの保存時に適用する対象、CI で適用済みを要求する対象を区別する。
- Parser 設定は実際に採用している構文を表すために使い、診断を消す目的で構文を過度に許容しない。

### デフォルトから始める

- まず Biome のデフォルトと推奨ルールで対象コードを解析し、設定を先に作り込んでから問題を探さない。
- 追加する各項目について、解決する問題、対象コードの範囲、採用しない場合の影響を説明できるようにする。説明できない設定は追加しない。
- 追加ルールは、検出したいリスクと修正方法が明確なものに限定する。Nursery のルールは安定性・誤検知・性能・将来の変更可能性を確認し、対象を狭く明示的に採用する。
- ルールを一括で有効化することを目的にしない。ルール衝突、診断ノイズ、修正不能状態、更新時の負担を確認できないなら、推奨ルールと目的のある個別ルールを優先する。

### severity は運用方針で決める

- `error` は CI やリリースを止めてでも直す問題、`warn` は検出を維持しつつ段階導入や既存コードの整理を許容する場合、`info` は通知のみで品質ゲートの失敗条件にしない場合に使う。
- 推奨ルールであることだけを理由に一律 `error` へ上書きしない。v2 はルールごとに Biome が提案するデフォルト severity を持ち、style グループの扱いも correctness や security と同一ではない。
- 既存コードへ段階導入するときは、広い ignore で診断を隠すのではなく、対象ルールの導入範囲・期限・修正計画を明確にする。

### 対象ファイルと除外

- `files.includes` は Formatter / Linter / Assist 共通の入口で、各ツールの `includes` がその集合をさらに狭める。ツール側だけで対象を絞れると考えず、最終的な交差範囲を確認する。
- `vcs.useIgnoreFile` で `.gitignore` を尊重する。`infra/cdk.out/` や `app` のビルド出力(`app/dist/`)といった生成物は解析対象に含めない。ただし、除外で診断数が減ったことだけを成功とみなさず、実行時に必要なファイルまで除外していないか確認する。
- glob とパスは `biome.json` を基準に解決される。`*` と `**` の違い、否定パターンの順序、ディレクトリを対象にする記法を、シェルの glob と混同しない。

### overrides と suppression は狭く保つ

- `overrides` は明確な境界を持つ例外に限定し、広い glob で通常の source 全体へ広げない。適用順序と例外の理由を追跡可能にする。
- ルールを無効化する前に、コードの修正、ルールの対象範囲、severity、`overrides` で表現できないかを検討する。
- 個別の suppression コメントは false positive・外部仕様・生成コードなど、ソースを直せない理由がある場合の最後の手段とし、対象を最小限にして理由を必ず残す。同じ suppression が繰り返されるなら、個別の例外を増やす前に設定の境界・ドメイン・ルール選択・生成処理の設計を見直す。

### 他ツールとの責務を重ねない

- 型の正しさは TypeScript が source of truth とする(型チェックは `infra` の `npm run build`、`app` の `npm run build`)。Biome の lint と競合する場合は型を優先し、必要なら対象の狭い `overrides` または suppression で調整する。
- 未使用のファイル・export・依存は Knip、テストは Vitest(`app` の `test:unit`／`test:dom`、`infra` の `test`)、ワークフローの検査は actionlint が担当する。これらを Biome で代替せず、重複診断や相反する自動修正が生じたら、どちらを source of truth とするかを決めて片方を狭める。

### 変更後の検証

- 対象 version の Biome で `biome check`(Formatter / Linter / Assist の統合結果)と、CI 相当の `biome ci`(書き込みなし、`.github/workflows/pr-ci-gate.yml` の `biome` job と同じ)を実行する。schema 検証だけで確認したことにしない。
- ルールは名前だけで判断せず、`biome explain <rule>` で目的・severity・修正方法を確認する。
- 変更した `includes` / `overrides` の実効範囲に、意図しない source・test・生成物・設定ファイルが含まれないことを確認する。
- safe fix と unsafe fix の差分を分けて確認し、自動修正後に型チェック・テスト・build を実行する。
- 診断数が減った場合は、修正で解消したのか、対象から除外したのか、severity を下げたのかを区別する。後二者は検出能力を失っていないことを別途確認する。

### バージョン更新

- メジャー更新時は公式の migration guide と `biome migrate --write` を起点にし、自動更新の差分(glob、設定パス、severity、`package.json` の書式、import organizer、Assist の変更)を確認してから受け入れる。
- upgrade では整形結果・診断・修正アクションが変わる可能性を変更として扱い、意図した変更と機械的な差分を分けてレビューする。

### 公式資料

使用中の Biome v2 の version に対応する公式ドキュメントを優先する。

- [Configure Biome](https://biomejs.dev/guides/configure-biome)
- [Configuration reference](https://biomejs.dev/reference/configuration)
- [Formatter Option Philosophy](https://biomejs.dev/formatter/option-philosophy)
- [Linter](https://biomejs.dev/linter)
- [Assist](https://biomejs.dev/assist)
- [Use Biome in big projects](https://biomejs.dev/guides/big-projects)
- [Continuous Integration](https://biomejs.dev/recipes/continuous-integration)
- [Upgrade to Biome v2](https://biomejs.dev/guides/upgrade-to-biome-v2)

## コメントの方針

- コメントを読まないと理解できないコードは、命名や構造の見直しで解決すること。コメントによる補足を先に選ばないこと。
- コメントは、コードそのものからは読み取れない「なぜ」を説明する場合に限り書くこと。対象は次のようなものに絞ること。
  - 一見不要または非直感的に見えるが必要な処理(既知の制約への回避策、外部仕様上の要求など)とその理由。
  - 複数の実装案からあえてその実装を選んだ理由(トレードオフの説明)。
  - コードだけでは伝わらない業務上・ドメイン上の制約。
- 次のようなコメントは書かないこと。
  - コードの内容をそのまま日本語や英語で言い換えただけの説明。
  - 関数名・変数名・型名を読めば分かる説明。
  - 変更履歴、担当者名、Issue番号などのメタ情報(コミットメッセージやPRの説明に書くこと)。
  - 不要になったコード(コメントアウトで残さず削除すること)。
- コメントで意図を補う前に、次の手段で「コメントなしで読める」状態を優先すること。
  - 変数・関数・型に、意図が伝わる名前を付ける。
  - 複雑な条件式を、意味のある名前の変数や関数へ分解する。
  - ガード節や早期returnで、例外的なケースを本流のロジックから分離する。
  - 大きな関数を、単一の責務を持つ小さな関数に分割する。
