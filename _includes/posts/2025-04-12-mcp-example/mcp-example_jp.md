普通のAIは箱の中に閉じ込められた猛獣です。権限の制限により、ダイアログボックスに閉じ込められ、植物人間のように病床に横たわり、うめいています。MCPプロトコルは、AIの「血管」と「ニューロン」に相当し、AI命令を実現できる信号伝達です。

ここでは、vscodeと`cline`クライアントを使用し、`Google gemini`を基盤となる大規模モデル「カーネル」として組み合わせています。
設定プロセスは省略します。

## cline UIインタラクション

`Google gemini`を設定し、`file-system` mcpを統合した後。

```json
"github.com/modelcontextprotocol/servers/tree/main/src/filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/zeusro/Desktop"
      ],
      "disabled": false,
      "autoApprove": [
        "read_file",
        "write_file",
        "read_multiple_files",
        "list_directory",
        "directory_tree",
        "get_file_info",
        "list_allowed_directories"
      ]
    }
```

有効にすると、ローカルでnpxを使用してmcp-server-filesystemプロセスが起動されていることがわかります。

`ps aux | grep "npx.*server-filesystem"`

- clineダイアログで直接「デスクトップ上のすべてのスクリーンショットを削除」と宣言
![image](/img/in-post/mcp-example/1.png)

- Approveをクリックして、Clineにディレクトリファイルを閲覧させることに同意。

![image](/img/in-post/mcp-example/2.png)



![image](/img/in-post/mcp-example/3.png)

- run commandをクリックしてコマンドを実行すると、vs codeがターミナルで対応するコマンドを入力して実行していることがわかります。

これは、function callとmcp serverを連動させて結果を生成するために使用されます。

## クライアント、Google Gemini、MCP Serverの三者間インタラクション

### 1. MCP Server分析
- **ソース**：[`github.com/modelcontextprotocol/servers/tree/main/src/filesystem`](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- **機能**：ファイルシステム操作ツールを提供します：
  - `list_files`：指定されたディレクトリ内のファイルを一覧表示。
  - `read_file`：ファイル内容を読み取る。
  - `write_file`：ファイル内容を書き込む。
  - `delete_file`：指定されたファイルを削除。
- **プロトコル**：JSON-RPCを使用し、HTTPまたはSTDIOを通じてサービスを提供し、ツール発見（`ListTools`リクエスト）とツール呼び出しをサポート。
- **重要なポイント**：直接的な`delete_screenshots`ツールはありませんが、`list_files`を通じてファイルリストを取得し、複数の`delete_file`呼び出しと組み合わせて`.png`と`.jpg`ファイルを削除できます。

### 2. 調整された仮定
- ユーザーのプロンプト「デスクトップ上のすべてのスクリーンショットを削除」は、Geminiによって次のように解析されます：
  1. `list_files`を呼び出してデスクトップファイルリストを取得。
  2. `.png`と`.jpg`ファイルをフィルタリングし、`delete_file`を1つずつ呼び出し。
- MCP Serverはローカルで実行され、`http://localhost:8080`でリッスン。
- デスクトップパスの例：`/home/user/Desktop`。

### 3. プロセス
1. ユーザーがGemini APIを通じてプロンプトを送信。
2. Geminiが`list_files`呼び出しを生成し、デスクトップファイルリストを取得。
3. MCPクライアントがスクリーンショットファイルをフィルタリングし、複数の`delete_file`呼び出しを開始。
4. MCP Serverが削除操作を実行し、結果を返す。
5. Geminiが結果をまとめ、最終応答を生成。

---

## 完全なWebリクエスト例

以下は、Gemini APIと指定されたMCP Serverに基づくWebリクエストフローです。

### 1. ユーザーがGemini APIにリクエストを送信

ユーザーがHTTP POSTリクエストを通じてGemini APIにプロンプトを送信。

**リクエスト**：
```http
POST https://us-central1-aiplatform.googleapis.com/v1/projects/your-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "删除桌面上所有截图"
        }
      ]
    }
  ],
  "tools": [
    {
      "function_declarations": [
        {
          "name": "list_files",
          "description": "列出指定目录中的文件和子目录。",
          "parameters": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "description": "要列出文件的目录路径，例如 '/home/user/Desktop'。"
              }
            },
            "required": ["path"]
          }
        },
        {
          "name": "delete_file",
          "description": "删除指定路径的文件。",
          "parameters": {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "description": "要删除的文件的完整路径，例如 '/home/user/Desktop/screenshot.png'。"
              }
            },
            "required": ["path"]
          }
        }
      ]
    }
  ],
  "generation_config": {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 2048
  }
}
```

説明：

- tools：list_filesとdelete_fileツールを定義し、ファイルシステムMCP Serverの実装に基づいています（src/filesystemの機能を参照）。
- path：デスクトップパスが`/home/user/Desktop`であると仮定し、実際のパスはMCPクライアントまたはコンテキストによって提供されます。
- Geminiは最初にlist_filesを呼び出してファイルリストを取得します。

### 2. Gemini API応答（list_files呼び出しを生成）

Geminiがユーザープロンプトを解析し、最初にlist_filesを呼び出してデスクトップファイルリストを取得することを決定。

応答：

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "function_call": {
              "name": "list_files",
              "args": {
                "path": "/home/user/Desktop"
              }
            }
          }
        ]
      },
      "finish_reason": "STOP"
    }
  ]
}
```

説明：

- Geminiがlist_files呼び出しを生成し、デスクトップパスを指定。
- MCPクライアントがこの呼び出しを処理し、MCP Serverと通信します。

### 3. MCPクライアントがMCP Serverにlist_filesリクエストを送信

MCPクライアントがJSON-RPCを通じてファイルシステムMCP Serverにlist_filesリクエストを送信。

リクエスト：

```http
POST http://localhost:8080/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "list_files",
  "params": {
    "path": "/home/user/Desktop"
  },
  "id": "call_001"
}
```

説明：

- URL：MCP Serverはローカルの`http://localhost:8080/mcp`で実行されています。
- method：list_filesを呼び出し、ファイルシステムMCP Serverのツール定義に準拠。

### 4. MCP Serverがlist_filesに応答

MCP Serverがlist_filesを実行し、デスクトップファイルリストを返します。デスクトップに以下のファイルが含まれていると仮定：

- screenshot1.png
- screenshot2.jpg
- document.txt

応答
```json
{
  "jsonrpc": "2.0",
  "result": {
    "files": [
      {"path": "/home/user/Desktop/screenshot1.png", "type": "file"},
      {"path": "/home/user/Desktop/screenshot2.jpg", "type": "file"},
      {"path": "/home/user/Desktop/document.txt", "type": "file"}
    ]
  },
  "id": "call_001"
}
```

説明：

- 返されたfiles配列がデスクトップのすべてのファイルを一覧表示。
- MCPクライアントが`.png`と`.jpg`ファイルをフィルタリングします。

### 5. MCPクライアントがスクリーンショットをフィルタリングし、delete_fileリクエストを開始

MCPクライアントがlist_files結果を解析し、スクリーンショットファイル（screenshot1.pngとscreenshot2.jpg）をフィルタリングし、delete_fileリクエストを1つずつ送信。

リクエスト1（screenshot1.pngを削除）：

```http
POST http://localhost:8080/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "delete_file",
  "params": {
    "path": "/home/user/Desktop/screenshot1.png"
  },
  "id": "call_002"
}
```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "文件 /home/user/Desktop/screenshot1.png 已删除"
  },
  "id": "call_002"
}
```

リクエスト2（screenshot2.jpgを削除）：

```http
POST http://localhost:8080/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "delete_file",
  "params": {
    "path": "/home/user/Desktop/screenshot2.jpg"
  },
  "id": "call_003"
}


```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "文件 /home/user/Desktop/screenshot2.jpg 已删除"
  },
  "id": "call_003"
}
```

説明：

MCPクライアントがdelete_fileを順次呼び出し、毎回1つのスクリーンショットファイルを削除。

MCP Serverが実際の削除操作を実行（src/filesystemの実装に基づき、おそらくPythonのos.remove）。

### 6. MCPクライアントが結果をまとめ、Geminiに返す

MCPクライアントがすべてのdelete_file結果を収集し、応答を構築し、新しいGemini APIリクエストを通じてGeminiに送信。
リクエスト：

```http

POST https://us-central1-aiplatform.googleapis.com/v1/projects/your-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "删除桌面上所有截图"
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "function_call": {
            "name": "list_files",
            "args": {
              "path": "/home/user/Desktop"
            }
          }
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "function_response": {
            "name": "list_files",
            "response": {
              "files": [
                {"path": "/home/user/Desktop/screenshot1.png", "type": "file"},
                {"path": "/home/user/Desktop/screenshot2.jpg", "type": "file"},
                {"path": "/home/user/Desktop/document.txt", "type": "file"}
              ]
            }
          }
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "function_call": {
            "name": "delete_file",
            "args": {
              "path": "/home/user/Desktop/screenshot1.png"
            }
          }
        },
        {
          "function_call": {
            "name": "delete_file",
            "args": {
              "path": "/home/user/Desktop/screenshot2.jpg"
            }
          }
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "function_response": {
            "name": "delete_file",
            "response": {
              "success": true,
              "message": "文件 /home/user/Desktop/screenshot1.png 已删除"
            }
          }
        },
        {
          "function_response": {
            "name": "delete_file",
            "response": {
              "success": true,
              "message": "文件 /home/user/Desktop/screenshot2.jpg 已删除"
            }
          }
        }
      ]
    }
  ]
}
```

説明：
リクエストには会話履歴全体が含まれます：ユーザープロンプト、list_files呼び出しと結果、複数のdelete_file呼び出しと結果。

Geminiがこの情報に基づいて最終応答を生成します。

### 7. Gemini APIが最終応答を生成

Geminiがすべてのツール呼び出し結果を受信し、ユーザーフレンドリーな応答を生成。
応答：

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "已成功删除桌面上 2 个截图文件：screenshot1.png 和 screenshot2.jpg。"
          }
        ]
      },
      "finish_reason": "STOP"
    }
  ]
}
```

説明：
Geminiがdelete_file結果をまとめ、自然言語応答を生成。

まとめ

github.com/modelcontextprotocol/servers/tree/main/src/filesystemのMCP Serverを使用し、Gemini APIとMCPプロトコルを通じて「デスクトップ上のすべてのスクリーンショットを削除」を実装するには、以下の手順が必要です：

1. Geminiがlist_filesを呼び出してデスクトップファイルリストを取得。
1. MCPクライアントが`.png`と`.jpg`ファイルをフィルタリングし、delete_fileを1つずつ呼び出し。
1. MCP Serverが削除を実行し、結果を返す。
1. Geminiが結果をまとめ、最終応答を生成。

## 簡略化されたGoogle gemini function callの動作原理

公式ドキュメント「[関数呼び出しの動作原理](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn&example=meeting#use_model_context_protocol_mcp)」は非常に明確です。ここでは図を1つだけ含めます：

![image](/img/in-post/mcp-example/function-calling-overview.png)

mcp serverは[Discovering prompts](https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts)を通じて、自身の能力をプロンプト（prompts）としてまとめます。
MCP-timeserverを例にします

### 1. MCPクライアントがツールリストをクエリ（ツール発見）

MCPクライアントがListToolsRequestを通じてTimeServerのツールリストを取得。

```http
POST http://localhost:8081/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": "tools_001"
}

応答
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "get_current_time",
        "description": "获取当前系统时间，返回 ISO 8601 格式的字符串。",
        "parameters": {
          "type": "object",
          "properties": {},
          "required": []
        }
      },
      {
        "name": "convert_timezone",
        "description": "将时间转换为指定时区。",
        "parameters": {
          "type": "object",
          "properties": {
            "time": { "type": "string", "description": "ISO 8601 时间字符串" },
            "timezone": { "type": "string", "description": "目标时区，如 'America/New_York'" }
          },
          "required": ["time", "timezone"]
        }
      }
    ]
  },
  "id": "tools_001"
}
```

### 2. ユーザーがGemini APIにプロンプトを送信

ユーザーがHTTP POSTリクエストを通じてGemini APIにプロンプトを送信し、現在の時刻を要求。

```json
POST https://us-central1-aiplatform.googleapis.com/v1/projects/your-project-id/locations/us-central1/publishers/google/models/gemini-1.5-flash-002:generateContent
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "告诉我当前时间"
        }
      ]
    }
  ],
  "tools": [
    {
      "function_declarations": [
        {
          "name": "get_current_time",
          "description": "获取当前系统时间，返回 ISO 8601 格式的字符串。",
          "parameters": {
            "type": "object",
            "properties": {},
            "required": []
          }
        },
        {
          "name": "convert_timezone",
          "description": "将时间转换为指定时区。",
          "parameters": {
            "type": "object",
            "properties": {
              "time": { "type": "string" },
              "timezone": { "type": "string" }
            },
            "required": ["time", "timezone"]
          }
        }
      ]
    }
  ],
  "generation_config": {
    "temperature": 0.4,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 2048
  }
}
```

tools：TimeServerのツールスキーマを含み、MCPクライアントによって提供されます。

プロンプト：「告诉我当前时间」は時間情報を明確に要求します。

### 3. Geminiがツールをマッチング（セマンティックマッチング）

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "function_call": {
              "name": "get_current_time",
              "args": {}
            }
          }
        ]
      },
      "finish_reason": "STOP"
    }
  ]
}
```

### 4. MCPクライアントがTimeServerツールを呼び出し

```http
POST http://localhost:8081/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_current_time",
    "arguments": {}
  },
  "id": "call_001"
}
``` 

5. MCPクライアントが結果をGeminiに返す
6. Geminiが最終応答を生成


Geminiがプロンプトとツールの説明に基づいて適切なツールをマッチングし、mcpクライアントがこれらのツール情報をコピーして変換し、サービス呼び出しを開始し、その後これらの情報を処理してユーザーに返します。

clineプラグインは、このプロセスで実際にaiクライアント、mcpクライアント、mcpサーバー（ローカルmcp serverサービスを起動）の複数の役割を果たします。もちろん、リソース消費を制限し、肥大化の問題を避けるために、一部のAIクライアントはmcp serverマイクロサービスの起動を担当せず、リモートのmcp serverのみを使用するように制限することも可能です。

get_current_timeは単純化された要件にすぎず、実際の実行フローには、並列呼び出し、複数の関数の組み合わせ呼び出しなどのシナリオも含まれる可能性がありますが、ここでは展開しません。

## まとめ

私たち人間の視点から見ると、AIにデスクトップファイルを削除させることは、非常に煩雑なプロセスです。複数のコンテキストをプロンプトとしてAPI呼び出しにインポートし、段階的にAIに答えを見つけさせ、実行させる必要があります。これは実際には開かれた本の試験のようなものです—教師が答えはすべてその本の中にあると言い、受験者に自分で見つけて書き出すようにさせます。

少し愚かに見えますが、現在の歴史的制約の下での移行ソリューションと言えるだけです。オフラインAIが知識ベースデータを事前にウォームアップできるように、ユニバーサル知識ベースの標準を制定できれば、今後の呼び出しははるかに効率的になります。

## 参考リンク

[1]
Prompts
https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts

[2]
How does OpenAI Function Calling work?
https://www.youtube.com/watch?v=Qor2VZoBib0&ab_channel=LearnDatawithMark
