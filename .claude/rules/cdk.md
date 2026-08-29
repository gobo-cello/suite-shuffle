---
paths:
  - "infra/**/*.ts"
---

# AWS CDK の書き方

AWS CDK v2 公式の best practices(docs.aws.amazon.com/cdk/v2/guide/best-practices.html)に従うこと。

## Construct と Stack の役割

- **Construct でモデル化し、Stack でデプロイする**: 論理単位(サイト、配信、監視など)は複数リソースをまとめた高レベル Construct として表現すること。Stack は Construct をどう組み合わせ・接続してデプロイするかだけを記述すること。
- **L2 Construct を基本にする**: 生の `Cfn*`(L1)は L2 が無い場合に限ること。
- **設定は props とメソッドで渡す**: Construct や Stack の内部で環境変数を読まないこと。環境変数の読み取りは CDK アプリのエントリポイント(`bin/`)に限定すること(`infra-env-vars.md` 参照)。

## 合成時に決める

- **CloudFormation の `Conditions` / `Fn::If` / `Parameters` を使わない**: どの Construct を作るか、繰り返し、分岐は TypeScript の `if` や `map` で書き、synth 時に確定させること。CloudFormation は出力先であって記述言語ではない。
- **全ステージをコードで表現する**: 環境ごとに Stack を用意し、設定値はコードに埋めること。機微値だけ Secrets Manager / SSM Parameter Store を名前・ARN で参照すること。

## 決定性を保つ

- **synth 中に AWS アカウントを変更しない / ネットワーク呼び出しをしない**: synth は副作用のない処理にすること。デプロイ時にしかできない処理は custom resource で行うこと。
- **`.fromLookup()` の結果(`cdk.context.json`)はコミットする**: 将来の synth が同じ値を使うようにするため。ネイティブの context provider が無い値は、別スクリプトで取得してファイルに書き出し、CDK からはそれを読むこと。

## 命名と論理 ID

- **物理名(`bucketName` など)をハードコードしない**: CDK に生成させ、必要な箇所へは `table.tableName` のように参照渡し・環境変数・SSM で渡すこと。別スタックへはスタック間参照、別アプリへは `Table.fromArn()` などを使うこと。
- **ステートフルリソースの論理 ID を変えない**: DB・S3・VPC などはリネームやツリー内の移動で論理 ID が変わると置換され、データを失う。論理 ID が固定であることをテストで assert すること。
- **ステートフルとステートレスをスタックで分ける**: ステートフル側に termination protection をかけられるようにすること。ステートフルリソースを、移動・リネームされやすい Construct にネストしないこと。

## IAM とデータ保護

- **IAM ロールとセキュリティグループは CDK に管理させる**: `bucket.grantRead(fn)` のような `grant*` メソッドで最小権限を生成すること。手書きの IAM ポリシーを組み立てないこと。
- **removal policy とログ保持期間を本番リソースごとに明示する**: CDK の既定は「全部保持」なので、放置するとコストが増える。Aspects で検証すること。

## テスト

- **fine-grained assertions を主軸にする**: `Template.fromStack(stack)` に対し `hasResourceProperties`(既定は部分一致)や `resourceCountIs` で検証すること。厳密さは `Match.objectEquals` と `Match.anyValue` の入れ子で調整し、不定値は `Capture` で取り出して検証すること。
- **snapshot テストは補助にとどめる**: CDK 本体や Toolkit の更新でも差分が出るためリグレッション検出には使えない。リファクタリングで「意図しない変化がないこと」を確認する用途に限り、多用しないこと。
- **Stack ではなく Construct 単位でテストできる**: `new Stack()` に対象 Construct を直接ぶら下げること。デプロイ用の Stack とテスト用の構成は見た目で区別できるようにすること(`testing.md` 参照)。
