# 歌单管理 API 文档

本文档介绍了 IkunMusic 中歌单管理功能的使用方法，包括后端服务类和前端 API 接口。

## 概述

歌单管理系统提供了完整的歌单和歌曲管理功能，包括：

- 📁 **歌单管理**：创建、删除、编辑、搜索歌单
- 🎵 **歌曲管理**：添加、移除、搜索歌单中的歌曲
- 📊 **统计分析**：获取歌单和歌曲的统计信息
- 🔧 **数据维护**：验证和修复歌单数据完整性
- ⚡ **批量操作**：支持批量删除和批量移除操作

## 架构设计

```
前端 (Renderer Process)
├── src/renderer/src/api/songList.ts          # 前端 API 封装
├── src/renderer/src/examples/songListUsage.ts # 使用示例
└── src/types/songList.ts                      # TypeScript 类型定义

主进程 (Main Process)
├── src/main/events/songList.ts                # IPC 事件处理
├── src/main/services/songList/ManageSongList.ts # 歌单管理服务
└── src/main/services/songList/PlayListSongs.ts  # 歌曲管理基类
```

## 快速开始

### 1. 前端使用

```typescript
import songListAPI from '@/api/songList'

// 创建歌单
const result = await songListAPI.create('我的收藏', '我最喜欢的歌曲')
if (result.success) {
  console.log('歌单创建成功，ID:', result.data?.id)
}

// 获取所有歌单
const playlists = await songListAPI.getAll()
if (playlists.success) {
  console.log('歌单列表:', playlists.data)
}

// 添加歌曲到歌单
const songs = [
  /* 歌曲数据 */
]
await songListAPI.addSongs(playlistId, songs)
```

### 2. 类型安全

所有 API 都提供了完整的 TypeScript 类型支持：

```typescript
import type { IPCResponse, SongListStatistics } from '@/types/songList'

const stats: IPCResponse<SongListStatistics> = await songListAPI.getStatistics()
```

## API 参考

### 歌单管理

#### `create(name, description?, source?)`

创建新歌单

```typescript
const result = await songListAPI.create('我的收藏', '描述', 'local')
// 返回: { success: boolean, data?: { id: string }, error?: string }
```

#### `getAll()`

获取所有歌单

```typescript
const result = await songListAPI.getAll()
// 返回: { success: boolean, data?: SongList[], error?: string }
```

#### `getById(hashId)`

根据ID获取歌单

```typescript
const result = await songListAPI.getById('playlist-id')
// 返回: { success: boolean, data?: SongList | null, error?: string }
```

#### `delete(hashId)`

删除歌单

```typescript
const result = await songListAPI.delete('playlist-id')
// 返回: { success: boolean, error?: string }
```

#### `batchDelete(hashIds)`

批量删除歌单

```typescript
const result = await songListAPI.batchDelete(['id1', 'id2'])
// 返回: { success: boolean, data?: { success: string[], failed: string[] } }
```

#### `edit(hashId, updates)`

编辑歌单信息

```typescript
const result = await songListAPI.edit('playlist-id', {
  name: '新名称',
  description: '新描述'
})
```

#### `search(keyword, source?)`

搜索歌单

```typescript
const result = await songListAPI.search('关键词', 'local')
// 返回: { success: boolean, data?: SongList[], error?: string }
```

### 歌曲管理

#### `addSongs(hashId, songs)`

添加歌曲到歌单

```typescript
const songs: Songs[] = [
  /* 歌曲数据 */
]
const result = await songListAPI.addSongs('playlist-id', songs)
```

#### `removeSong(hashId, songmid)`

移除单首歌曲

```typescript
const result = await songListAPI.removeSong('playlist-id', 'song-id')
// 返回: { success: boolean, data?: boolean, error?: string }
```

#### `removeSongs(hashId, songmids)`

批量移除歌曲

```typescript
const result = await songListAPI.removeSongs('playlist-id', ['song1', 'song2'])
// 返回: { success: boolean, data?: { removed: number, notFound: number } }
```

#### `getSongs(hashId)`

获取歌单中的歌曲

```typescript
const result = await songListAPI.getSongs('playlist-id')
// 返回: { success: boolean, data?: readonly Songs[], error?: string }
```

#### `searchSongs(hashId, keyword)`

搜索歌单中的歌曲

```typescript
const result = await songListAPI.searchSongs('playlist-id', '关键词')
// 返回: { success: boolean, data?: Songs[], error?: string }
```

### 统计信息

#### `getStatistics()`

获取歌单统计信息

```typescript
const result = await songListAPI.getStatistics()
// 返回: {
//   success: boolean,
//   data?: {
//     total: number,
//     bySource: Record<string, number>,
//     lastUpdated: string
//   }
// }
```

#### `getSongStatistics(hashId)`

获取歌单歌曲统计信息

```typescript
const result = await songListAPI.getSongStatistics('playlist-id')
// 返回: {
//   success: boolean,
//   data?: {
//     total: number,
//     bySinger: Record<string, number>,
//     byAlbum: Record<string, number>,
//     lastModified: string
//   }
// }
```

### 数据维护

#### `validateIntegrity(hashId)`

验证歌单数据完整性

```typescript
const result = await songListAPI.validateIntegrity('playlist-id')
// 返回: { success: boolean, data?: { isValid: boolean, issues: string[] } }
```

#### `repairData(hashId)`

修复歌单数据

```typescript
const result = await songListAPI.repairData('playlist-id')
// 返回: { success: boolean, data?: { fixed: boolean, changes: string[] } }
```

### 便捷方法

#### `getPlaylistDetail(hashId)`

获取歌单详细信息（包含歌曲列表）

```typescript
const result = await songListAPI.getPlaylistDetail('playlist-id')
// 返回: {
//   playlist: SongList | null,
//   songs: readonly Songs[],
//   success: boolean,
//   error?: string
// }
```

#### `checkAndRepair(hashId)`

检查并修复歌单数据

```typescript
const result = await songListAPI.checkAndRepair('playlist-id')
// 返回: {
//   needsRepair: boolean,
//   repairResult?: RepairResult,
//   success: boolean,
//   error?: string
// }
```

## 错误处理

所有 API 都返回统一的响应格式：

```typescript
interface IPCResponse<T = any> {
  success: boolean // 操作是否成功
  data?: T // 返回的数据
  error?: string // 错误信息
  message?: string // 附加消息
  code?: string // 错误码
}
```

### 错误码说明

| 错误码               | 说明         |
| -------------------- | ------------ |
| `INVALID_HASH_ID`    | 无效的歌单ID |
| `PLAYLIST_NOT_FOUND` | 歌单不存在   |
| `EMPTY_NAME`         | 歌单名称为空 |
| `CREATE_FAILED`      | 创建失败     |
| `DELETE_FAILED`      | 删除失败     |
| `EDIT_FAILED`        | 编辑失败     |
| `READ_FAILED`        | 读取失败     |
| `WRITE_FAILED`       | 写入失败     |

## 使用示例

### 完整的歌单管理流程

```typescript
import songListAPI from '@/api/songList'

async function managePlaylist() {
  try {
    // 1. 创建歌单
    const createResult = await songListAPI.create('我的收藏', '我最喜欢的歌曲')
    if (!createResult.success) {
      throw new Error(createResult.error)
    }

    const playlistId = createResult.data!.id

    // 2. 添加歌曲
    const songs = [
      {
        songmid: 'song1',
        name: '歌曲1',
        singer: '歌手1',
        albumName: '专辑1',
        albumId: 'album1',
        duration: 240,
        source: 'local'
      }
    ]

    await songListAPI.addSongs(playlistId, songs)

    // 3. 获取歌单详情
    const detail = await songListAPI.getPlaylistDetail(playlistId)
    console.log('歌单信息:', detail.playlist)
    console.log('歌曲列表:', detail.songs)

    // 4. 搜索歌曲
    const searchResult = await songListAPI.searchSongs(playlistId, '歌曲')
    console.log('搜索结果:', searchResult.data)

    // 5. 获取统计信息
    const stats = await songListAPI.getSongStatistics(playlistId)
    console.log('统计信息:', stats.data)
  } catch (error) {
    console.error('操作失败:', error)
  }
}
```

### React 组件中的使用

```typescript
import React, { useState, useEffect } from 'react'
import songListAPI from '@/api/songList'
import type { SongList } from '@common/types/songList'

const PlaylistManager: React.FC = () => {
  const [playlists, setPlaylists] = useState<SongList[]>([])
  const [loading, setLoading] = useState(false)

  // 加载歌单列表
  const loadPlaylists = async () => {
    setLoading(true)
    try {
      const result = await songListAPI.getAll()
      if (result.success) {
        setPlaylists(result.data || [])
      }
    } catch (error) {
      console.error('加载歌单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 创建新歌单
  const createPlaylist = async (name: string) => {
    const result = await songListAPI.create(name)
    if (result.success) {
      await loadPlaylists() // 重新加载列表
    }
  }

  // 删除歌单
  const deletePlaylist = async (id: string) => {
    const result = await songListAPI.safeDelete(id, async () => {
      return confirm('确定要删除这个歌单吗？')
    })

    if (result.success) {
      await loadPlaylists() // 重新加载列表
    }
  }

  useEffect(() => {
    loadPlaylists()
  }, [])

  return (
    <div>
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div>
          {playlists.map(playlist => (
            <div key={playlist.id}>
              <h3>{playlist.name}</h3>
              <p>{playlist.description}</p>
              <button onClick={() => deletePlaylist(playlist.id)}>
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 性能优化建议

1. **批量操作**：使用 `batchDelete` 和 `removeSongs` 进行批量操作
2. **数据缓存**：在前端适当缓存歌单列表，避免频繁请求
3. **懒加载**：歌曲列表可以按需加载，不必一次性加载所有数据
4. **错误恢复**：使用 `checkAndRepair` 定期检查数据完整性

## 注意事项

1. 所有 API 都是异步的，需要使用 `await` 或 `.then()`
2. 歌单 ID (`hashId`) 是唯一标识符，不要与数组索引混淆
3. 歌曲 ID (`songmid`) 可能是字符串或数字类型
4. 删除操作是不可逆的，建议使用 `safeDelete` 方法
5. 大量数据操作时注意性能影响

## 更新日志

### v1.0.0 (2024-01-10)

- ✨ 初始版本发布
- ✨ 完整的歌单管理功能
- ✨ 批量操作支持
- ✨ 数据完整性检查
- ✨ TypeScript 类型支持
- ✨ 详细的使用文档和示例

---

如有问题或建议，请提交 Issue 或 Pull Request。
