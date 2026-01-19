[5年前](https://www.bullshitprogram.com/the-seed-of-robot/)、私はAIをインテリジェントなAPIゲートウェイに例え、大きな問題を複数の解決可能な小さな問題に変換する分割統治のアプローチを提案しました。

```go
func sum(arr []int) int {
    if len(arr) == 1 {
        return arr[0]
    }
    mid := len(arr) / 2
    leftSum := sum(arr[:mid])
    rightSum := sum(arr[mid:])
    return leftSum + rightSum
}
```

上記の再帰的合計関数のように—配列を半分に分割し、各部分を再帰的に合計します。

今日、このアイデアは[MCP](https://modelcontextprotocol.io/introduction)プロトコルで継続されています。

2025-04の期間中、私は`cline`と`Google gemini`を基盤となる大規模モデル「カーネル」として使用し、大規模言語モデルがMCPを呼び出す完全なプロトコルを研究しました。

しかし、現在、MCPの実装はまだやや醜く、いくつかの問題があります。
そして、大規模モデル自体の問題により、過剰なトークン消費が発生します。

## 現状

MCPプロトコルには組み込みのサービス発見システムがあります。各MCPサーバーは実装と呼び出し方法を登録し、呼び出し時にプロンプトに追加し、リモートAIサーバーにリクエストするパラメータとして、AIが正しいコマンドを見つけてローカルで実行できるようにします。

例えば、[Gemini Function Call](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn)は大体次のようになります：

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tools": [
      {
        "function_declarations": [
          {
            "name": "get_current_weather",
            "description": "Get the current weather for a given location",
            "parameters": {
              "type": "object",
              "properties": {
                "location": {
                  "type": "string",
                  "description": "The city and country, e.g. Shanghai, China"
                }
              },
              "required": ["location"]
            }
          }
        ]
      }
    ],
    "contents": [
      {
        "parts": [
          {
            "text": "What is the weather in Shanghai right now?"
          }
        ]
      }
    ]
  }'
```

プロセス全体は非常に複雑になる可能性があります。例えば、AIに「デスクトップ上のすべてのスクリーンショットを削除」と指示する場合、理想的なコマンドは：

```bash
find /Users/zeusro/Desktop -type f -name "Screenshot*.png" -delete && find /Users/zeusro/Desktop -type f -name "Screenshot*.jpg" -delete
```

しかし、実際の実行プロセスは次のようになる可能性があります：

1. このパス上のすべてのファイルを見つけ、対応するパスを取得
1. スクリーンショット画像1を削除
1. スクリーンショット画像2を削除
1. スクリーンショット画像nを削除

![image](/img/in-post/mcp-limitation//传统ai问路.png)

この計算プロセスは大規模モデル自身の能力に依存します。gemini-2.0のような場合は最初のケースで、直接1ステップです。国内の他のモデルは基本的に無料APIを提供していないため、基本的に使用しません。

```bash
input --> process --> output --> (評価) influence、次の計算を実行するかどうかを検討
```

人間は外部観察者として、評価し、計算の影響を観察し、プロンプトを補足し、AIに計算を続けさせ、最終結果を得るまで絶えず修正します。

```zeusro
func 计算(){
    ai.找到合适的工具链调用()
    （可选）用户.评估潜在影响并决定是否要执行相应命令
    ai+mcp client(通常可以在ai客户端里面顺便集成mcp功能，比如vs code cline插件).调用mcp server()
    （可选）用户.评估最终影响()
        if 满足需求（）{
            return
            }
        else{
            用户.补充提示词，继续向ai提问()
            计算()
        }
}
```

コードプロジェクト管理の観点から解釈すると、AIと人間の関係は「開発者」と「レビューア」のようなもので、レビューアがコードを「マージ」するかどうかを決定します。

## local functionとcloud function

2020年、私は配車を例として`Cloud Function`を提案しました。

`Cloud Function`は、補助計算を完了するためにクラウドのソフトウェアおよびハードウェアリソースに依存する関数を指します。

`Cloud Function`に対応するのは`Local Function`です。

`Local Function`はオフライン計算関数を指します。
狭義では、`Local Function`はネットワークなしで実行でき、一般的にオペレーティングシステムのAPIと理解されます。広義では、`Local Function`はローカルハードウェアのローカル関数を指します。
携帯電話で北京時間を取得するようなもの—携帯電話には内蔵時計がありますが、時間は国家授時センターから定期的に同期する必要があります。

これは家の目覚まし時計のようなものです—バッテリーがあれば動きますが、時間のずれにより、定期的に手動で時間を較正する必要があります。

## `local function call`と`cloud function call`の分離

![image](/img/in-post/mcp-limitation/远程本地函数分离.png)

しかし、私の意見では、MCPプロトコルの現在の実装は次善策（移行ソリューション）としか考えられません。
実際、この段階でより必要なのは「関数の分離」であり、関数を`local function call`と`cloud function call`に分けることです。`local function call`の場合、
ネットワークなしでも実行でき、「xxアプリを開く」、「おばあちゃんにメッセージを送る」などのニーズは、クラウド関数をまったく必要とせず、「オフライン計算」で処理できます。

AIは準備された知識ベースを持ち、異なるオペレーティングシステムに直面したときに、サポートできるAPIを組み込むべきです。現在のように、ファイルを削除するだけで[file-system](github.com/modelcontextprotocol/servers/tree/main/src/filesystem)を構築して実装する必要はありません。

実際、主要な国内システムのAIエントリーポイントはこのように実装されています。xxアシスタントがユーザーの音声コマンドを解析し、実行する必要がある具体的なサブタスクに翻訳します。

## 結論

MCPプロトコルは移行設計として、AI API（AI向けの言語/OS非依存インターフェース）の`app store`標準を確立するような役割を果たします。このタスクを完了した後、段階的に廃止できます。

![image](/img/in-post/mcp-limitation/ps.gif)
