Обычный AI — это зверь, запертый в коробке. Ограниченные разрешения заставляют его оставаться в диалоговом окне, лежать на больничной кровати, как овощ, стонать. Протокол MCP подобен "кровеносным сосудам" и "нейронам" AI — это передача сигналов, которая позволяет выполнять инструкции AI.

Здесь я использую vscode с клиентом `cline`, в паре с `Google gemini` в качестве базовой большой модели "ядро".
Процесс конфигурации я пропущу.

## Взаимодействие с UI cline

После настройки `Google gemini` и интеграции `file-system` mcp.

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

После включения вы обнаружите, что процесс mcp-server-filesystem запущен локально с помощью npx.

`ps aux | grep "npx.*server-filesystem"`

- Напрямую объявить "удалить все скриншоты на моём рабочем столе" в диалоге cline
![image](/img/in-post/mcp-example/1.png)

- Нажмите Approve, чтобы согласиться позволить Cline просматривать файлы каталога.

![image](/img/in-post/mcp-example/2.png)



![image](/img/in-post/mcp-example/3.png)

- Нажмите run command, чтобы выполнить команду, затем вы увидите, как vs code вводит и выполняет соответствующую команду в терминале.

Здесь используется function call в сочетании с mcp server для получения результатов.

## Трёхстороннее взаимодействие между клиентом, Google Gemini и MCP Server

### 1. Анализ MCP Server
- **Источник**: [`github.com/modelcontextprotocol/servers/tree/main/src/filesystem`](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- **Функция**: Предоставляет инструменты для работы с файловой системой, включая:
  - `list_files`: Список файлов в указанном каталоге.
  - `read_file`: Чтение содержимого файла.
  - `write_file`: Запись содержимого файла.
  - `delete_file`: Удаление указанного файла.
- **Протокол**: Использует JSON-RPC, предоставляет услуги через HTTP или STDIO, поддерживает обнаружение инструментов (запрос `ListTools`) и вызов инструментов.
- **Ключевой момент**: Нет прямого инструмента `delete_screenshots`, но можно получить список файлов через `list_files`, в сочетании с несколькими вызовами `delete_file` для удаления файлов `.png` и `.jpg`.

### 2. Скорректированные предположения
- Подсказка пользователя "удалить все скриншоты на рабочем столе" анализируется Gemini как:
  1. Вызов `list_files` для получения списка файлов рабочего стола.
  2. Фильтрация файлов `.png` и `.jpg`, вызов `delete_file` по одному.
- MCP Server работает локально, прослушивает `http://localhost:8080`.
- Пример пути рабочего стола: `/home/user/Desktop`.

### 3. Процесс
1. Пользователь отправляет подсказку через Gemini API.
2. Gemini генерирует вызов `list_files` для получения списка файлов рабочего стола.
3. MCP-клиент фильтрует файлы скриншотов и инициирует несколько вызовов `delete_file`.
4. MCP Server выполняет операции удаления и возвращает результаты.
5. Gemini суммирует результаты и генерирует окончательный ответ.

---

## Полный пример веб-запроса

Ниже приведён поток веб-запросов на основе Gemini API и указанного MCP Server.

### 1. Пользователь отправляет запрос в Gemini API

Пользователь отправляет подсказку через HTTP POST-запрос в Gemini API.

**Запрос**:
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

Объяснение:

- tools: Определяет инструменты list_files и delete_file на основе реализации MCP Server файловой системы (см. функциональность src/filesystem).
- path: Предполагает, что путь рабочего стола — `/home/user/Desktop`, фактический путь предоставляется MCP-клиентом или контекстом.
- Gemini сначала вызовет list_files для получения списка файлов.

### 2. Ответ Gemini API (генерирует вызов list_files)

Gemini анализирует подсказку пользователя и решает сначала вызвать list_files для получения списка файлов рабочего стола.

Ответ:

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

Объяснение:

- Gemini генерирует вызов list_files, указывая путь рабочего стола.
- MCP-клиент обработает этот вызов и будет общаться с MCP Server.

### 3. MCP-клиент отправляет запрос list_files в MCP Server

MCP-клиент отправляет запрос list_files в MCP Server файловой системы через JSON-RPC.

Запрос:

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

Объяснение:

- URL: MCP Server работает локально на `http://localhost:8080/mcp`.
- method: Вызывает list_files, соответствует определению инструмента MCP Server файловой системы.

### 4. MCP Server отвечает на list_files

MCP Server выполняет list_files и возвращает список файлов рабочего стола. Предположим, что на рабочем столе есть следующие файлы:

- screenshot1.png
- screenshot2.jpg
- document.txt

Ответ
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

Объяснение:

- Возвращённый массив files перечисляет все файлы рабочего стола.
- MCP-клиент отфильтрует файлы `.png` и `.jpg`.

### 5. MCP-клиент фильтрует скриншоты и инициирует запросы delete_file

MCP-клиент анализирует результаты list_files, отфильтровывает файлы скриншотов (screenshot1.png и screenshot2.jpg) и отправляет запросы delete_file по одному.

Запрос 1 (удалить screenshot1.png):

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

Запрос 2 (удалить screenshot2.jpg):

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

Объяснение:

MCP-клиент последовательно вызывает delete_file, каждый раз удаляя один файл скриншота.

MCP Server выполняет фактическую операцию удаления (на основе реализации src/filesystem, вероятно, os.remove в Python).

### 6. MCP-клиент суммирует результаты и возвращает Gemini

MCP-клиент собирает все результаты delete_file, конструирует ответ и отправляет обратно в Gemini через новый запрос Gemini API.
Запрос:

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

Объяснение:
Запрос содержит всю историю разговора: подсказка пользователя, вызов list_files и результаты, несколько вызовов delete_file и результаты.

Gemini сгенерирует окончательный ответ на основе этой информации.

### 7. Gemini API генерирует окончательный ответ

Gemini получает все результаты вызовов инструментов и генерирует удобный для пользователя ответ.
Ответ:

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

Объяснение:
Gemini суммирует результаты delete_file и генерирует ответ на естественном языке.

Резюме

Используя MCP Server из github.com/modelcontextprotocol/servers/tree/main/src/filesystem, реализация "удалить все скриншоты на рабочем столе" через Gemini API и протокол MCP требует следующих шагов:

1. Gemini вызывает list_files для получения списка файлов рабочего стола.
1. MCP-клиент фильтрует файлы `.png` и `.jpg` и вызывает delete_file по одному.
1. MCP Server выполняет удаление и возвращает результаты.
1. Gemini суммирует результаты и генерирует окончательный ответ.

## Упрощённый принцип работы Google Gemini Function Call

Официальная документация "[Как работает вызов функций](https://ai.google.dev/gemini-api/docs/function-calling?hl=zh-cn&example=meeting#use_model_context_protocol_mcp)" очень ясна, здесь я просто включу диаграмму:

![image](/img/in-post/mcp-example/function-calling-overview.png)

MCP server суммирует свои возможности как подсказки (prompts) через [Discovering prompts](https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts).
В качестве примера используем MCP-timeserver

### 1. MCP-клиент запрашивает список инструментов (обнаружение инструментов)

MCP-клиент получает список инструментов TimeServer через ListToolsRequest.

```http
POST http://localhost:8081/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": "tools_001"
}

Ответ
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

### 2. Пользователь отправляет подсказку в Gemini API

Пользователь отправляет подсказку через HTTP POST-запрос в Gemini API, запрашивая текущее время.

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

tools: Содержит схему инструментов TimeServer, предоставленную MCP-клиентом.

Подсказка: "告诉我当前时间" явно запрашивает информацию о времени.

### 3. Gemini сопоставляет инструмент (семантическое сопоставление)

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

### 4. MCP-клиент вызывает инструмент TimeServer

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

5. MCP-клиент возвращает результаты в Gemini
6. Gemini генерирует окончательный ответ


Gemini будет сопоставлять подходящие инструменты на основе подсказок и описаний инструментов. MCP-клиент копирует и преобразует эту информацию об инструментах, инициирует вызовы сервисов, затем обрабатывает эту информацию и возвращает её пользователю.

Плагин cline фактически выполняет несколько ролей в этом процессе: AI-клиент, MCP-клиент, MCP-сервер (запуск локального сервиса MCP server). Конечно, некоторые AI-клиенты, чтобы ограничить потребление ресурсов и избежать чрезмерной раздутости, не будут брать на себя ответственность за запуск микросервисов MCP server, а вместо этого ограничатся использованием только удалённых MCP-серверов, что также приемлемо.

get_current_time — это всего лишь упрощённое требование. Фактический поток выполнения может также включать параллельные вызовы, комбинированные вызовы нескольких функций, которые я здесь не буду расширять.

## Резюме

С нашей человеческой точки зрения, заставить AI удалить файлы рабочего стола — это очень громоздкий процесс. Нам нужно импортировать несколько контекстов как подсказки в вызовы API, постепенно позволяя AI находить ответы и выполнять их. Это на самом деле немного похоже на экзамен с открытой книгой — учитель говорит, что ответы все в той книге, позволяя студентам найти и написать их самим.

Выглядит немного глупо, можно сказать только переходное решение в рамках текущих исторических ограничений. Если бы мы могли установить стандарт для универсальной базы знаний, позволяя офлайн AI предварительно разогревать данные базы знаний, то будущие вызовы были бы намного более эффективными.

## Ссылки

[1]
Prompts
https://modelcontextprotocol.io/docs/concepts/prompts#discovering-prompts

[2]
How does OpenAI Function Calling work?
https://www.youtube.com/watch?v=Qor2VZoBib0&ab_channel=LearnDatawithMark
