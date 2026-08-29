---
paths:
  - ".github/workflows/*.yml"
  - ".github/workflows/*.yaml"
---

# GitHub Actions のバージョン固定

- ワークフロー(`.github/workflows/*.yml`)で使用するGitHub Actionsは、可変なタグ(`@v4`など)ではなく、固定されたコミットハッシュで指定すること。
- コミットハッシュの末尾に`# vX.Y.Z`の形式で、参照したタグのバージョンをコメントとして残すこと。
- 理由: タグは後から書き換え可能であり、意図しないコードが実行されるサプライチェーン攻撃のリスクがあるため。
