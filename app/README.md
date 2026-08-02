# app

Suite Shuffleのフロントエンドアプリケーションです。Vite + React + TypeScriptで構成します。

## 開発

```sh
npm ci
npm run dev
```

## ビルド

```sh
npm run build
```

ビルド成果物は`dist/`に出力され、`infra/`のHostingStackがこのディレクトリをS3へデプロイします。
