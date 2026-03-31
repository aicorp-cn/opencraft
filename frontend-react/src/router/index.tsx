import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { HomePageV2 } from '../pages/HomePageV2'

/**
 * 路由配置
 * 
 * OpenCraft 是单页面游戏应用：
 * - HomePageV2: 游戏主界面（使用 dnd-v2 拖拽系统）
 * - 帮助页面已改为 HomePage 内的弹窗形式
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePageV2 />,
      },
    ],
  },
])
