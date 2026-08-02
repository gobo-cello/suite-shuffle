# suite-shuffle

Suite Shuffleのアプリケーション、コンテンツ、ワークロード用Infrastructure as Codeリポジトリです。

このリポジトリはpublicです。コード、設定、ドキュメント、Issue、Pull Requestなど、リポジトリ内のすべての情報は第三者から閲覧される前提で管理します。

## 目的

Suite Shuffleを配信するアプリケーション、ワークロード用インフラストラクチャをこのリポジトリで管理します。

AWS Organizations全体の共通基盤(監査ログの一元管理、Service Control Policyなど)は、ライフサイクルとfailure domainが異なるため、別のInfrastructure as Codeリポジトリ(`aws-platform`)で管理します。

## 管理対象

- Suite Shuffleのアプリケーションコード
- Suite Shuffleの本番環境(`suite-shuffle-production`)・検証環境(`suite-shuffle-sandbox`)向けワークロードインフラストラクチャ(`infra/`)
- GitHub ActionsとAWSのOIDC連携
- GitHub Actions用のIAM role

実装されていない項目については、今後このリポジトリへ段階的に追加します。

## 管理対象外

次の情報およびリソースは、このリポジトリでは管理しません。

- AWS Organizations、Management accountの設定
- CloudTrailログの一元管理、IAM Access Analyzerなど組織横断の監査・セキュリティ基盤
- Service Control Policy
- AWS root userの認証情報
- IAM Identity Centerのユーザーおよび認証情報
- 個人のメールアドレスや電話番号
- AWSアカウントの代替連絡先
- ドメインレジストラの認証情報
- Password、API key、access token、private keyなどのsecret
- ドメインそのものの登録および更新

これらは、組織レベルの共通基盤を管理する別のInfrastructure as Codeリポジトリ(`aws-platform`)で管理します。

## AWSアカウント構成

このリポジトリがデプロイ対象とするのは、次のAWSアカウントです。

- `suite-shuffle-production`: 本番のワークロード
- `suite-shuffle-sandbox`: 開発・検証用のワークロード

これらのアカウントは、AWS Organizations配下のProduction OU・Sandbox OUにそれぞれ所属します。Organizationsの管理、CloudTrailなどの監査ログ基盤、Management accountの運用は、`aws-platform`リポジトリの責務であり、このリポジトリでは前提として扱います。

実際のAWS account ID、Organization ID、メールアドレスなど、公開する必要のない環境固有情報はリポジトリへ保存しません。

## 認証方針

人間によるAWSへのアクセスにはIAM Identity Centerを使用します。

GitHub ActionsからAWSへのアクセスにはOpenID Connectを使用し、短時間のみ有効な一時認証情報を取得します。

長期的なAWS access keyは使用しません。

## ディレクトリ構成

リポジトリ直下に共通の開発ツール設定を置き、CDK applicationは`infra/`、アプリケーション本体は`app/`ディレクトリで、それぞれ独立したnpm projectとして管理します。

```text
suite-shuffle/
├── infra/                # AWS CDK application(独立npm project)
│   ├── bin/               # CDK applicationのentry point
│   ├── lib/
│   │   ├── config/         # secretを含まない環境設定
│   │   ├── constructs/     # 複数のAWS resourceからなる論理的な機能単位
│   │   └── stacks/         # AWS accountまたはdeployment boundaryごとのStack
│   ├── test/               # CDK templateおよびConstructのテスト
│   ├── cdk.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── app/                   # Vite + React + TypeScript(独立npm project)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── .github/
│   ├── actions/
│   ├── workflows/
│   ├── copilot-instructions.md
│   └── dependabot.yml
├── .claude/
│   └── CLAUDE.md
├── .gitignore
├── .node-version
├── .npmrc
├── lefthook.yml
├── package.json
├── README.md
└── SECURITY.md
```

このツリーは各ディレクトリの役割を示す骨格であり、網羅的なファイル一覧ではありません。

`app/`のMVPにおけるデータモデル・技術選定・UI設計方針(モードレスデザインの採用など)は[ADR 0001](./docs/adr/0001-mvp-implementation-approach.md)を参照してください。

`infra/`配下は次の責務で分割しています。

- `infra/bin/`: CDK applicationのentry point
- `infra/lib/stacks/`: AWS accountまたはdeployment boundaryごとのStack
- `infra/lib/constructs/`: 複数のAWS resourceからなる論理的な機能単位
- `infra/lib/config/`: secretを含まない環境設定
- `infra/test/`: CDK templateおよびConstructのテスト

使用されていないStack、Construct、directory、設定ファイルは先行して作成しません。

## 開発環境

必要なtoolは次のとおりです。

- Git
- Node.js(バージョンは`.node-version`を参照)
- npm
- AWS CLI
- AWS CDK CLI

リポジトリ直下・`infra/`・`app/`はそれぞれ独立したnpm projectです。

リポジトリ直下の依存関係(lint、git hooks)をインストールします。

```sh
npm ci
```

`infra/`の依存関係をインストールします。

```sh
cd infra
npm ci
```

TypeScriptを型チェックします。

```sh
cd infra
npm run build
```

テストを実行します。

```sh
cd infra
npm test
```

CloudFormation templateを生成します。

```sh
cd infra
npx cdk synth
```

`app/`の依存関係をインストールします。

```sh
cd app
npm ci
```

ローカル開発サーバーを起動します。

```sh
cd app
npm run dev
```

テストを実行します。

```sh
cd app
npm test
```

静的サイトをビルドします。

```sh
cd app
npm run build
```

## Lintとgit hooks

このリポジトリはLintに[Biome](https://biomejs.dev/)を使用します。

```sh
npm run check
```

git hooksには[lefthook](https://github.com/evilmartians/lefthook)を使用します。`npm ci`実行時に`prepare`スクリプトが自動的に`lefthook install`を実行します。

- pre-commit: 変更されたファイルへBiomeを適用します。
- pre-push: `infra/`でbuild、テスト、`cdk synth`、`app/`でbuild、テストを実行します。
- commit-msg: Conventional Commitsの形式を検証します。

## AWS CLIプロファイル

人間によるAWSへのアクセスにはIAM Identity Center(AWS SSO)を使用し、長期的なAWS access keyは使用しません。

ローカルの`~/.aws/config`に、account・role単位でprofileを分けて設定します。実際のaccount IDやSSO start URLはリポジトリへ保存しないため、プレースホルダーで示します。

```ini
[profile suite-shuffle-production]
sso_session = gobo-cello
sso_account_id = 実際のProduction account ID
sso_role_name = AdministratorAccess
region = ap-northeast-1
output = json

[profile suite-shuffle-sandbox]
sso_session = gobo-cello
sso_account_id = 実際のSandbox account ID
sso_role_name = AdministratorAccess
region = ap-northeast-1
output = json

[sso-session gobo-cello]
sso_start_url = 実際のSSO Start URL
sso_region = ap-northeast-1
sso_registration_scopes = sso:account:access
```

`aws sso login --profile <profile名>`でログインしてから、各`--profile`オプションでコマンドを実行します。

## GitHub ActionsとAWSの接続

GitHub ActionsからAWSへは、OIDCによる一時認証だけを使用します。長期的なAWS access keyは発行しません。

`infra/`には、GitHub ActionsがOIDCでdeployするための`SandboxGithubDeployRoleStack` / `ProductionGithubDeployRoleStack`が定義されています。GitHub Actions自身は自分のtrust関係を初回だけ自動デプロイできないため(chicken-and-egg)、次の手順を人手で1回だけ行う必要があります。

1. ローカルのAdministratorAccess profileで、両accountにCDK bootstrapを実行します。

   ```sh
   cd infra
   npx cdk bootstrap aws://<Sandbox account ID>/ap-northeast-1 --profile suite-shuffle-sandbox
   npx cdk bootstrap aws://<Production account ID>/ap-northeast-1 --profile suite-shuffle-production
   ```

2. `infra/.env.local`(gitignore対象、`.env.example`を元に作成)にaccount IDを設定し、ローカルから初回だけ手動でdeployします。

   ```sh
   cd infra
   npx cdk deploy SandboxGithubDeployRoleStack --profile suite-shuffle-sandbox
   npx cdk deploy ProductionGithubDeployRoleStack --profile suite-shuffle-production
   ```

3. deploy出力の`GithubDeployRoleArn`を控えます。

4. GitHubリポジトリに Environment `sandbox` / `production` を作成し、`production`にRequired Reviewersを設定します。

5. 次のGitHub Variablesを登録します。

   - Repository Variables: `AWS_SUITE_SHUFFLE_SANDBOX_ACCOUNT_ID`、`AWS_SUITE_SHUFFLE_PRODUCTION_ACCOUNT_ID`、`SUITE_SHUFFLE_DOMAIN_NAME`
   - Environment `sandbox` Variables: `AWS_SUITE_SHUFFLE_SANDBOX_DEPLOY_ROLE_ARN`(手順3のSandbox側ARN)
   - Environment `production` Variables: `AWS_SUITE_SHUFFLE_PRODUCTION_DEPLOY_ROLE_ARN`(手順3のProduction側ARN)

以降は、Pull Requestでの`cdk diff`、`main`へのmergeによる`deploy.yml`の自動実行(`sandbox` job)、その成功後の`production` jobの承認付き実行で運用します。

## ドメインとDNS

`suite-shuffle.gobo-cello.com`のhosted zoneと、CloudFront用のACM証明書(DNS検証)を`ProductionDnsStack`で管理しています。`sandbox.suite-shuffle.gobo-cello.com`は同様に`SandboxDnsStack`で管理しています。

CloudFrontで使用するACM証明書は`us-east-1`でしか発行できないため、`suite-shuffle-production`accountの主リージョン(`ap-northeast-1`)とは別に`us-east-1`のCDK bootstrapが必要です。また、apex hosted zone(`gobo-cello.com`)は`aws-platform`リポジトリが管理しており、cross-repositoryでのname server受け渡しが必要なため、次の順序で1回だけ手動セットアップします。

1. `suite-shuffle-production`accountで、`us-east-1`のCDK bootstrapを実行します。

   ```sh
   cd infra
   npx cdk bootstrap aws://<Production account ID>/us-east-1 --profile suite-shuffle-production
   ```

2. `ProductionDnsStack`をdeployします(NS委譲はまだ設定しません)。

   ```sh
   cd infra
   npx cdk deploy ProductionDnsStack --profile suite-shuffle-production
   ```

3. deploy出力の`SuiteShuffleHostedZoneNameServers`を、`aws-platform`リポジトリの`SUITE_SHUFFLE_SUBDOMAIN_NAME_SERVERS`環境変数に設定し、`aws-platform`側の`DnsStack`を再deployします。

4. `dig suite-shuffle.gobo-cello.com NS`で委譲が反映されていること、`aws acm describe-certificate`等で証明書が`ISSUED`になっていることを確認します。

`sandbox.suite-shuffle.gobo-cello.com`は`suite-shuffle.gobo-cello.com`のhosted zoneからNS delegationを受けるため、上記の後に続けて次の手順を1回だけ手動セットアップします。

5. `suite-shuffle-sandbox`accountで、`us-east-1`のCDK bootstrapを実行します。

   ```sh
   cd infra
   npx cdk bootstrap aws://<Sandbox account ID>/us-east-1 --profile suite-shuffle-sandbox
   ```

6. `SandboxDnsStack`をdeployします。

   ```sh
   cd infra
   npx cdk deploy SandboxDnsStack --profile suite-shuffle-sandbox
   ```

7. deploy出力の`SandboxSuiteShuffleHostedZoneNameServers`を、GitHub Repository Variable `SANDBOX_SUBDOMAIN_NAME_SERVERS`として登録し、`ProductionDnsStack`を再deployします(登録しないと、以後`infra/**`を変更するPRがmergeされるたびにNS委譲レコードが削除されます)。

   ```sh
   cd infra
   npx cdk deploy ProductionDnsStack --profile suite-shuffle-production
   ```

8. `dig sandbox.suite-shuffle.gobo-cello.com NS`で委譲が反映されていること、証明書が`ISSUED`になっていることを確認します。

## Git運用

`main` branchは常にbuild、test、CDK synthが成功する状態を維持します。

変更は原則として作業branchで行い、Pull Requestを通じて`main`へmergeします。

Commit messageはConventional Commitsに従います。

```text
<type>(<scope>): <日本語の要約>
```

## Security

脆弱性またはsecretの漏えいを発見した場合は、public Issueへ詳細を投稿しないでください。

対応方法については[`SECURITY.md`](./SECURITY.md)を参照してください。

## License

Licenseは別途決定します。Licenseを追加するまでは、著作権者から明示的に許可された範囲を除き、コードの利用、複製、変更、再配布は許諾されません。
