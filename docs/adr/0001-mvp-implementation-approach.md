# 0001: Suite Shuffle MVPの実装方針

- Status: Accepted
- Date: 2026-08-02

## Context

Suite Shuffleは、YouTube・YouTube Musicの楽曲URLを登録して再生リストを作るwebアプリである。クラシック音楽を主な利用場面として想定しており、通常のランダム再生では「同じ作品の楽章の順番が入れ替わってしまう」という不満を解消することが目的である。

この課題を解決するには、単純な1階層のプレイリスト(曲の集合)ではなく、「作品(楽章のまとまり)」という中間概念を持つデータモデルが必要になる。また、`infra/`側の基盤(Hosting・DNS・CI/CD)はすでに構築済みであり、`app/`側はViteの初期テンプレートのままである。MVPとして実装する範囲・データモデル・UI設計方針を、コードを書き始める前に決定する。

## Decision

### ① データモデル: Playlist > TrackGroup > Track の3階層

- `Track`: 1本の動画に対応する最小単位。`videoId`(YouTube video ID、branded typeで表現)と`sourceUrl`(登録時に入力された元URL)を持つ。
- `TrackGroup`: 「同じ作品としてまとめて扱いたい曲の並び」を表す単位(例: 交響曲の各楽章)。内部の`Track`の順序は常に維持され、シャッフルの対象にならない。
- `Playlist`: 複数の`TrackGroup`を持つ、ユーザーが作成する再生リストの単位。

シャッフルは`Playlist`が持つ`TrackGroup`の並び順に対してのみ行い、各`TrackGroup`内の`Track`順序は固定する。これにより「作品ごとにランダム再生されるが、楽章の順番は保たれる」という要求を満たす。

### ② 対応入力: YouTube / YouTube Music URLからのvideoId抽出

`SUPPORTED_HOSTS`(`youtube.com` / `www.youtube.com` / `m.youtube.com` / `music.youtube.com` / `youtu.be`)に該当するURLだけを受け付け、URLからvideoIdを抽出する。非対応ホスト・video ID抽出に失敗するURLは、登録時にエラーとして扱う。

### ③ 永続化: localStorage

MVP範囲ではサーバーサイドの永続化を持たず、`Playlist`一覧をlocalStorageに保存する。将来的なサーバー同期などへの移行を見据え、永続化層はstorageの実装詳細から独立したinterfaceの背後に置く。

### ④ 再生: YouTube IFrame Player API

再生には YouTube IFrame Player API を使用する。シャッフルロジック(`TrackGroup`単位のシャッフル、`TrackGroup`内`Track`の順序維持)は、Player APIとの結合から独立させ、単体でテスト可能な形で実装する。

### ⑤ UI設計: モードレスデザインを採用する

Larry Teslerが提唱する「no modes」の考え方に基づき、同じ操作が常に同じ結果を生む、明示的な状態切り替えを持たないUIを採用する。Suite Shuffleでの具体的な適用は次のとおりとする。

- 「編集モード」「再生モード」のような明示的な画面・状態の切り替えを設けない。プレイリストの作成・編集・再生を同一画面上で行う。
- 曲の追加、`TrackGroup`の並び替え・分割・結合、削除などの編集操作は、再生中かどうかに関わらず常時利用可能にする。編集のために再生を中断させたり、別画面へ遷移させたりしない。
- 操作の実行前に特定の「モード」を選択させるUIコンポーネント(編集/再生を排他制御するタブ切り替えなど)を避け、直接操作(direct manipulation)によって同一画面上で完結させる。
- 曲追加のような頻出操作をモーダルダイアログの背後に隠さず、インライン入力欄を常時表示する。

理由: クラシック音楽のプレイリスト編集は、再生しながら曲順を確認・微調整したい場面が多く、モード間の往復コストがUXを損なう。学習コストと誤操作を減らすためにも、モードレスな設計を優先する。

### ⑥ 実装順序

次の順序で、小さくコミット可能な単位に分けて実装する。

1. ドメインモデルとURLパーサー(`Track` / `TrackGroup` / `Playlist`の型、URL→videoId変換)をテスト駆動で実装する。UIを持たない。
2. localStorageを使った永続化層(`Playlist`のCRUD)を実装する。
3. プレイリスト管理UI(URL貼り付けでの曲追加、`TrackGroup`単位の編集)を実装する。
4. YouTube IFrame Player APIと連携した再生機能(`TrackGroup`単位のシャッフル)を実装する。

## Consequences

- 本ADRはMVPのデータモデル・技術選定・UI設計方針を決定するものであり、実際のコード実装は本ADR以降、別コミット・別PRで段階的に行う。
- `Playlist` > `TrackGroup` > `Track`という3階層のデータモデルを採用したことで、既存の型スケッチ(`Track` / `YouTubeVideoId`)に加えて`TrackGroup` / `Playlist`の型を新たに設計する必要がある。
- モードレスデザインの採用により、画面遷移を前提としたルーティングの必要性が下がる。MVP範囲ではルーティングライブラリを導入せず、単一画面構成とする。
- localStorage採用は永続化層をinterfaceの背後に抽象化することを前提とする。将来的にサーバーサイド永続化(アカウント間同期など)へ移行する場合も、UI・ドメインロジック側への影響を局所化できる。
