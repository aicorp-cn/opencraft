import React from 'react'
import { Outlet } from 'react-router-dom'

/**
 * Layout - 应用框架层
 * 
 * 职责：
 * - 路由出口（Outlet）
 * 
 * 注意：
 * - DndContextProvider 已移至 HomePage 组件内部
 * - 因为 DndContext 需要 containerRef 来计算放置位置
 */
export const Layout: React.FC = () => {
  return <Outlet />
}