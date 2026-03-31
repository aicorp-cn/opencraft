# OpenCraft Frontend

React 18 + TypeScript + Vite 构建的元素合成游戏前端应用。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 5.3 | 类型安全 |
| Vite | 5.1 | 构建工具 |
| Zustand | 4.5 | 状态管理 |
| dnd-kit | 6.3 | 拖拽功能 |
| TailwindCSS | 3.4 | 样式框架 |
| @tanstack/react-virtual | 3.13 | 虚拟滚动 |
| axios | 1.6 | HTTP 客户端 |

## 应用截图

### 桌面端界面

![桌面端主界面](../docs/assets/screenshots/home-desktop.png)

*主界面：资源库在右侧，合成画布在左侧*

### 移动端界面

![移动端界面](../docs/assets/screenshots/home-mobile.png)

*移动端：资源库折叠在底部，最大化画布空间*

### 功能截图

| 元素详情弹窗 | 进度中心面板 |
|:---:|:---:|
| ![元素详情](../docs/assets/screenshots/element-detail.png) | ![进度中心](../docs/assets/screenshots/progress-center.png) |

## 项目结构

```
src/
├── components/              # UI 组件
│   ├── dnd-v2/             # 拖拽系统 v2
│   │   ├── DndContextProviderV2.tsx  # 拖拽上下文
│   │   ├── DroppableCanvas.tsx       # 画布放置区
│   │   ├── DraggableCanvasElement.tsx # 画布元素
│   │   ├── DraggableResourceItem.tsx  # 资源库元素
│   │   ├── ResourceSidebarV2.tsx      # 资源库侧边栏
│   │   ├── useDndContext.ts           # 拖拽 Hook
│   │   └── styles.ts                  # 样式定义
│   ├── Header.tsx          # 顶部导航
│   ├── ProgressCenter.tsx  # 进度中心弹窗
│   ├── ElementDetail.tsx   # 元素详情弹窗
│   ├── Achievements.tsx    # 成就面板
│   └── ...
│
├── stores/                  # Zustand 状态管理
│   ├── useResourcesStore.ts # 元素资源库
│   ├── useBoxesStore.ts     # 画布元素
│   ├── useHistoryStore.ts   # 合成历史
│   └── useAchievementStore.ts # 成就系统
│
├── services/               # 服务层
│   ├── soundService.ts     # 音效服务
│   └── shareService.ts     # 分享服务
│
├── constants/              # 常量定义
│   └── synthesisTypes.ts   # 合成类型定义
│
├── pages/                  # 页面组件
│   └── HomePageV2.tsx      # 主页面
│
├── router/                 # 路由配置
│   └── index.tsx
│
└── utils/                  # 工具函数
    ├── animations.ts       # 动画效果
    └── timeFormat.ts       # 时间格式化
```

## 核心模块说明

### 1. 状态管理 (Zustand)

#### useResourcesStore - 元素资源库

管理玩家已发现的所有元素。

```typescript
interface ResourcesState {
  resources: ResourceStoreEntry[]  // 元素列表
  addResource: (resource) => void  // 添加新元素
  hasResource: (title) => boolean  // 检查是否已发现
  resetResources: () => void       // 重置资源库
  getCurrentStage: () => GrowthStage  // 获取当前成长阶段
}
```

**元素分类**：
- `basic`: 基础元素（Fire, Water, Earth, Air）
- `nature`: 自然元素（Tree, Ocean, Mountain...）
- `artifact`: 人造元素（Tool, Building, Vehicle...）
- `abstract`: 抽象元素（Time, Energy, Love...）

#### useBoxesStore - 画布元素

管理画布上的元素实例。

```typescript
interface BoxesState {
  boxes: Record<string, BoxStoreEntry>  // 画布元素映射
  lockedBoxes: Record<string, boolean>  // 锁定状态（防止重复操作）
  addBox: (box) => string      // 添加元素
  removeBox: (id) => void      // 移除元素
  updateBoxPosition: (id, left, top) => void  // 更新位置
  lockBoxes: (ids) => boolean  // 锁定元素
}
```

#### useHistoryStore - 合成历史

记录所有合成操作历史。

```typescript
interface HistoryState {
  entries: HistoryEntry[]      // 历史记录
  typeStats: TypeStatistics    // 合成类型统计
  addEntry: (first, second, result) => void
  clearHistory: () => void
}
```

#### useAchievementStore - 成就系统

管理成就解锁状态。

```typescript
interface AchievementState {
  unlockedIds: string[]            // 已解锁成就
  pendingNotificationIds: string[] // 待通知成就
  checkAchievements: (discovered, syntheses) => string[]
}
```

**成就列表**：
| ID | 名称 | 条件 |
|----|------|------|
| first_discovery | 初次发现 | 发现 1 个元素 |
| explorer | 探索者 | 发现 10 个元素 |
| alchemist | 炼金术士 | 完成 25 次合成 |
| master | 元素大师 | 发现 50 个元素 |
| legend | 传奇创造者 | 发现 100 个元素 |

### 2. 拖拽系统 (dnd-kit v2)

#### 架构设计

```
DndContextProviderV2 (Context Provider)
├── useDndContext (Hook) - 封装拖拽逻辑
├── DroppableCanvas - 画布放置区
│   └── DraggableCanvasElement - 可拖拽的画布元素
└── ResourceSidebarV2 - 资源库侧边栏
    └── DraggableResourceItem - 可拖拽的资源项
```

#### 拖拽场景

| 场景 | 触发条件 | 行为 |
|------|----------|------|
| 资源库 → 画布 | 资源项拖入画布 | 在画布创建元素实例 |
| 画布元素移动 | 元素拖到空白区域 | 更新元素位置 |
| 元素合成 | 元素 A 拖到元素 B | 调用合成 API |

#### 碰撞检测策略

```typescript
// 优先使用精确指针检测，回退到矩形相交检测
const collisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return rectIntersection(args)
}
```

### 3. 音效服务 (soundService)

使用 Web Audio API 程序化生成音效，无需外部音效文件。

```typescript
interface SoundConfig {
  enabled: boolean        // 音效开关
  ttsEnabled: boolean     // 语音播报开关
  ttsMode: 'all' | 'important' | 'off'  // 播报模式
  volume: number          // 音量 0-1
}

// 音效方法
soundService.playSuccess()    // 合成成功
soundService.playFail()       // 合成失败
soundService.playRare()       // 发现新元素
soundService.playAchievement() // 解锁成就

// 语音播报
soundService.speakNewDiscovery(name)  // 播报新发现
```

## 开发指南

### 环境要求

- Node.js >= 18.0
- npm >= 9.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

输出目录：`dist/`

### 代码检查

```bash
npm run lint
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| VITE_API_BASE_URL | http://127.0.0.1:3100 | 后端 API 地址 |

## API 调用

### POST /api/craft/v2

合成两个元素。

**请求**：
```json
{
  "first": "Fire",
  "second": "Water"
}
```

**响应**：
```json
{
  "word": "Steam",
  "emoji": "💨",
  "lang": "en",
  "reasoning": {
    "type": "Physical/Chemical",
    "role_first": "Heat source",
    "role_second": "Substance to transform",
    "trace": "Fire provides thermal energy..."
  },
  "explanation": "Water vapor produced when liquid water is heated..."
}
```

## 响应式设计

| 屏幕尺寸 | 布局 |
|----------|------|
| < 1024px (移动端) | 资源库固定底部，高度 35vh |
| >= 1024px (桌面端) | 资源库右侧边栏，宽度 35% |

## 性能优化

### 虚拟滚动

资源库使用 `@tanstack/react-virtual` 实现虚拟滚动，优化大量元素的渲染性能。

```typescript
const virtualizer = useVirtualizer({
  count: rowCount,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => itemHeight,
  overscan: 5,
})
```

### 状态持久化

使用 Zustand 的 persist 中间件自动持久化到 localStorage：

```typescript
persist(
  (set, get) => ({ /* state */ }),
  { name: 'opencraft/resources', storage: createJSONStorage(() => localStorage) }
)
```

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## 相关链接

- [dnd-kit 文档](https://docs.dndkit.com/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Vite 文档](https://vitejs.dev/)