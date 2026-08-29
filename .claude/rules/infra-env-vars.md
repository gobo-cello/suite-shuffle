---
paths:
  - "infra/lib/config/*.ts"
  - "infra/.env.example"
  - ".github/workflows/*.yml"
---

# 環境変数を追加・変更する際に確認するファイル

- `infra/lib/config/environments.ts`・`infra/lib/config/dns.ts`など: 環境変数のparse処理
- `infra/.env.example`: ローカル開発用の一覧
- `.github/workflows/deploy.yml`: 全ての`cdk deploy`ステップのenv。`bin/infra.ts`はターゲットのstackに関わらず全stackを構築するため、「このstackはこの環境変数を使わないから不要」という判断はできない
- `.github/workflows/pr-ci-gate.yml`: `cdk-synth`・`cdk-diff`ジョブのenv
