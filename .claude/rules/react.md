---
paths:
  - "app/**/*.{ts,tsx,jsx}"
---

# React の書き方

公式ドキュメント(react.dev)の推奨に従うこと。React のバージョンは `app/package.json` を確認する。

## Rules of React(破るとバグになる)

- **コンポーネントと Hook は純粋に保つ**: 同じ入力(props / state / context)には同じ結果を返すこと。レンダー中に副作用を起こさないこと。
- **props / state / Hook の引数と戻り値 / JSX に渡した値は不変として扱う**: ミューテーションは JSX を組み立てる前に済ませること。
- **コンポーネント関数を直接呼ばない**: JSX 経由でのみ使うこと。Hook を変数に入れたり引数で渡したりしないこと。
- **Hook はコンポーネントかカスタム Hook のトップレベルでのみ呼ぶ**: ループ・条件分岐・ネストした関数・早期 return より後で呼ばないこと。
- `StrictMode` を有効にし、Rules of Hooks を lint で強制すること(下記「lint と React Compiler」)。

## useEffect を安易に使わない

- Effect は外部システム(DOM の直接操作、購読、ネットワークなど)との同期専用とすること。外部システムが絡まないなら Effect は不要。
- 次はいずれも Effect を使わずに書くこと。
  - props / state からの派生値: レンダー中に計算する(state に持たない)。
  - 高コストな計算: `useMemo` で包む。
  - prop 変化に伴うコンポーネント状態の全リセット: `key` を変える。
  - prop 変化に伴う一部 state の調整: レンダー中に前回値と比較して調整する。可能なら「選択 ID だけ持ち、実体は派生」に設計し直す。
  - ユーザー操作起因の処理(通知、送信など): イベントハンドラに書く。
  - state を芋づる式に更新する Effect の連鎖: 1 つのイベントハンドラで次の state をまとめて計算する。
  - 外部ストアの購読: `useSyncExternalStore` を使う。
- データ取得を Effect で行う場合は、cleanup で無視フラグを立ててレース状態を防ぐこと。可能ならフレームワークの仕組みやカスタム Hook に寄せること。

## ロジックとレンダーの分離

- 状態遷移や入出力の計算などのロジックを、JSX を返す関数本体やカスタム Hook の内部に埋め込まないこと。独立した純粋関数として切り出すこと。
- 切り出したロジックは node 環境の単体テストで担保し、DOM 環境のテストはレンダー結果やユーザー操作の検証など薄い部分に限定すること(`testing.md` 参照)。

## React 19 以降の API

`app` の React が 19 以降なら、次を優先すること。

- フォーム送信・データ変更は Actions(`<form action={fn}>` と `useActionState`)を使う。pending・エラー・リセットが自動化される。
- 楽観的更新は `useOptimistic` を使う。
- Promise や context の読み取りは `use` を使う(条件分岐や早期 return の後でも呼べる)。
- `forwardRef` は使わず、`ref` を通常の prop として受け取る。
- コンテキストは `<Context value={...}>` を直接使う(`<Context.Provider>` は書かない)。
- ref コールバックは後始末が必要なら cleanup 関数を返す。
- `<title>` / `<meta>` / `<link>` はコンポーネント内に直接書いてよい。スタイルシートは `precedence` を指定する。

## lint と React Compiler

- Rules of Hooks / Rules of React の lint は `eslint-plugin-react-hooks` v6 の `recommended` プリセットで行うこと。旧 `eslint-plugin-react-compiler` は使わないこと(v6 に統合済み)。
- このリポジトリの lint は Biome に寄せている。Biome の `useHookAtTopLevel` / `useExhaustiveDependencies` は Rules of Hooks の一部しかカバーせず、React Compiler のルールを持たない。ESLint を併用するかは、コンポーネントを実装する前に方針を決めること。
- ビルドツールのプラグインで React Compiler(1.0、stable)を有効にした場合、Rules of React を守っている前提で手書きの `useMemo` / `useCallback` / `React.memo` は原則不要。新規に足さないこと。
