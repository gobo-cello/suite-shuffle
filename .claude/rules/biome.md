---
paths:
  - "biome.json"
---

# Biome 設定の方針

Biome の実行コマンド、safe / unsafe fix、CI での扱いは「品質確認と完了前チェック」節に従う。ここでは `biome.json` に何を入れ、何を入れないかの判断基準を定める。この節は「Knip 設定の方針」と同じ意図で、チェックを通すために設定でノイズを消すのではなく、実際の実行経路とプロジェクトの境界を正しくモデル化するために使う。

## 目的

Biome の設定は、CLI・エディター・CI が同じ品質基準を共有するためのプロジェクト方針として扱う。設定値を増やして個人の好みを細かく再現することではなく、可読性、問題の早期発見、安全な自動修正、意思決定コストの削減に寄与することを目的とする。

## 対象バージョンと構成

- Biome v2 を使う。`@biomejs/biome` は `package.json` の `devDependencies` で固定し、設定 schema と CLI の version を揃える。`latest` に依存して診断や整形結果を変動させない。gobo-cello の他リポジトリ(`aws-platform` / `blog` / `landing` / `suite-shuffle`)と version を揃え、片方だけ先行して結果が変わることを避ける。
- 設定はリポジトリ直下の `biome.json` 一つで、`infra/`・`app/` を含むリポジトリ全体をカバーする。各ディレクトリに本当に異なる責務・言語・ライフサイクルが生じない限り nested configuration(`extends: "//"` を含む)は置かない。設定の現状は `biome.json` を参照する。

## Formatter / Linter / Assist を分ける

- Formatter はレイアウトの一貫性を担当する意見の強いツールなので、書式の好みを設定項目の追加で再現しない。非デフォルトの formatter オプションは、既存標準との互換性や可読性など具体的な理由がある場合だけ採用する。
- Linter は誤り、危険な記述、不要な複雑さ、性能、セキュリティ、アクセシビリティなど、Formatter では扱わない品質問題を検出する。書式を Linter のルールで重ねて強制しない。
- Assist は常に修正を提案するアクションであり、バグ検出ではない。自動修正を採用する対象、エディターの保存時に適用する対象、CI で適用済みを要求する対象を区別する。
- Parser 設定は実際に採用している構文を表すために使い、診断を消す目的で構文を過度に許容しない。

## デフォルトから始める

- まず Biome のデフォルトと推奨ルールで対象コードを解析し、設定を先に作り込んでから問題を探さない。
- 追加する各項目について、解決する問題、対象コードの範囲、採用しない場合の影響を説明できるようにする。説明できない設定は追加しない。
- 追加ルールは、検出したいリスクと修正方法が明確なものに限定する。Nursery のルールは安定性・誤検知・性能・将来の変更可能性を確認し、対象を狭く明示的に採用する。
- ルールを一括で有効化することを目的にしない。ルール衝突、診断ノイズ、修正不能状態、更新時の負担を確認できないなら、推奨ルールと目的のある個別ルールを優先する。

## severity は運用方針で決める

- `error` は CI やリリースを止めてでも直す問題、`warn` は検出を維持しつつ段階導入や既存コードの整理を許容する場合、`info` は通知のみで品質ゲートの失敗条件にしない場合に使う。
- 推奨ルールであることだけを理由に一律 `error` へ上書きしない。v2 はルールごとに Biome が提案するデフォルト severity を持ち、style グループの扱いも correctness や security と同一ではない。
- 既存コードへ段階導入するときは、広い ignore で診断を隠すのではなく、対象ルールの導入範囲・期限・修正計画を明確にする。

## 対象ファイルと除外

- `files.includes` は Formatter / Linter / Assist 共通の入口で、各ツールの `includes` がその集合をさらに狭める。ツール側だけで対象を絞れると考えず、最終的な交差範囲を確認する。
- `vcs.useIgnoreFile` で `.gitignore` を尊重する。`infra/cdk.out/` や `app` のビルド出力(`app/dist/`)といった生成物は解析対象に含めない。ただし、除外で診断数が減ったことだけを成功とみなさず、実行時に必要なファイルまで除外していないか確認する。
- glob とパスは `biome.json` を基準に解決される。`*` と `**` の違い、否定パターンの順序、ディレクトリを対象にする記法を、シェルの glob と混同しない。

## overrides と suppression は狭く保つ

- `overrides` は明確な境界を持つ例外に限定し、広い glob で通常の source 全体へ広げない。適用順序と例外の理由を追跡可能にする。
- ルールを無効化する前に、コードの修正、ルールの対象範囲、severity、`overrides` で表現できないかを検討する。
- 個別の suppression コメントは false positive・外部仕様・生成コードなど、ソースを直せない理由がある場合の最後の手段とし、対象を最小限にして理由を必ず残す。同じ suppression が繰り返されるなら、個別の例外を増やす前に設定の境界・ドメイン・ルール選択・生成処理の設計を見直す。

## 他ツールとの責務を重ねない

- 型の正しさは TypeScript が source of truth とする(型チェックは `infra` の `npm run build`、`app` の `npm run build`)。Biome の lint と競合する場合は型を優先し、必要なら対象の狭い `overrides` または suppression で調整する。
- 未使用のファイル・export・依存は Knip、テストは Vitest(`app` の `test:unit`／`test:dom`、`infra` の `test`)、ワークフローの検査は actionlint が担当する。これらを Biome で代替せず、重複診断や相反する自動修正が生じたら、どちらを source of truth とするかを決めて片方を狭める。

## 変更後の検証

- 対象 version の Biome で `biome check`(Formatter / Linter / Assist の統合結果)と、CI 相当の `biome ci`(書き込みなし、`.github/workflows/pr-ci-gate.yml` の `biome` job と同じ)を実行する。schema 検証だけで確認したことにしない。
- ルールは名前だけで判断せず、`biome explain <rule>` で目的・severity・修正方法を確認する。
- 変更した `includes` / `overrides` の実効範囲に、意図しない source・test・生成物・設定ファイルが含まれないことを確認する。
- safe fix と unsafe fix の差分を分けて確認し、自動修正後に型チェック・テスト・build を実行する。
- 診断数が減った場合は、修正で解消したのか、対象から除外したのか、severity を下げたのかを区別する。後二者は検出能力を失っていないことを別途確認する。

## バージョン更新

- メジャー更新時は公式の migration guide と `biome migrate --write` を起点にし、自動更新の差分(glob、設定パス、severity、`package.json` の書式、import organizer、Assist の変更)を確認してから受け入れる。
- upgrade では整形結果・診断・修正アクションが変わる可能性を変更として扱い、意図した変更と機械的な差分を分けてレビューする。

## 公式資料

使用中の Biome v2 の version に対応する公式ドキュメントを優先する。

- [Configure Biome](https://biomejs.dev/guides/configure-biome)
- [Configuration reference](https://biomejs.dev/reference/configuration)
- [Formatter Option Philosophy](https://biomejs.dev/formatter/option-philosophy)
- [Linter](https://biomejs.dev/linter)
- [Assist](https://biomejs.dev/assist)
- [Use Biome in big projects](https://biomejs.dev/guides/big-projects)
- [Continuous Integration](https://biomejs.dev/recipes/continuous-integration)
- [Upgrade to Biome v2](https://biomejs.dev/guides/upgrade-to-biome-v2)
