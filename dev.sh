#!/bin/bash
# OpenCraft 开发环境管理脚本
# 用法: ./dev.sh [start|stop|status]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/server-python"
FRONTEND_DIR="${SCRIPT_DIR}/frontend-react"

# PID 文件路径
BACKEND_PID_FILE="${SCRIPT_DIR}/.opencraft-backend.pid"
FRONTEND_PID_FILE="${SCRIPT_DIR}/.opencraft-frontend.pid"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 验证进程是否属于本项目
# 参数: $1=PID, $2=预期工作目录
verify_process() {
    local pid=$1
    local expected_dir=$2
    
    # 检查进程是否存在
    if ! kill -0 "$pid" 2>/dev/null; then
        return 1
    fi
    
    # macOS 使用 lsof 获取进程工作目录
    local proc_cwd
    proc_cwd=$(lsof -p "$pid" 2>/dev/null | grep cwd | awk '{print $NF}')
    
    if [ -z "$proc_cwd" ]; then
        return 1
    fi
    
    # 验证工作目录是否匹配
    if [[ "$proc_cwd" == "$expected_dir"* ]]; then
        return 0
    else
        return 1
    fi
}

# 安全终止进程
# 参数: $1=PID文件路径, $2=预期工作目录, $3=服务名称
safe_kill() {
    local pid_file=$1
    local expected_dir=$2
    local service_name=$3
    
    if [ ! -f "$pid_file" ]; then
        echo -e "${YELLOW}${service_name}: 无 PID 文件，尝试按名称查找...${NC}"
        # 回退方案：使用更精确的命令匹配
        local pids
        case $service_name in
            "后端")
                pids=$(pgrep -f "uvicorn.*app.main:app" 2>/dev/null || true)
                ;;
            "前端")
                # 检测所有 vite 进程，然后验证工作目录
                pids=$(pgrep -f "vite" 2>/dev/null || true)
                ;;
        esac
        if [ -n "$pids" ]; then
            for pid in $pids; do
                if verify_process "$pid" "$expected_dir"; then
                    kill "$pid" 2>/dev/null && echo -e "${GREEN}${service_name}: 已终止 (PID: $pid)${NC}"
                fi
            done
        fi
        return
    fi
    
    local pid
    pid=$(cat "$pid_file")
    
    if verify_process "$pid" "$expected_dir"; then
        kill "$pid" 2>/dev/null && echo -e "${GREEN}${service_name}: 已终止 (PID: $pid)${NC}"
    else
        echo -e "${YELLOW}${service_name}: PID $pid 不属于本项目或已终止${NC}"
    fi
    
    rm -f "$pid_file"
}

# 检查服务状态
# 参数: $1=PID文件路径, $2=预期工作目录, $3=服务名称
check_status() {
    local pid_file=$1
    local expected_dir=$2
    local service_name=$3
    
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file")
        if verify_process "$pid" "$expected_dir"; then
            echo -e "${service_name}: ${GREEN}运行中${NC} (PID: $pid)"
            return 0
        else
            echo -e "${service_name}: ${RED}已停止${NC} (PID 文件存在但进程无效)"
            return 1
        fi
    else
        # 无 PID 文件，尝试按名称查找
        local pids
        case $service_name in
            "后端")
                pids=$(pgrep -f "uvicorn.*app.main:app.*3000" 2>/dev/null || true)
                ;;
            "前端")
                pids=$(pgrep -f "vite.*5174" 2>/dev/null || true)
                ;;
        esac
        
        if [ -n "$pids" ]; then
            echo -e "${service_name}: ${YELLOW}运行中${NC} (无 PID 文件，检测到进程: $pids)"
            return 0
        else
            echo -e "${service_name}: ${RED}已停止${NC}"
            return 1
        fi
    fi
}

start() {
    echo -e "${GREEN}启动开发环境...${NC}"
    
    # 检查是否已运行
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid
        backend_pid=$(cat "$BACKEND_PID_FILE")
        if verify_process "$backend_pid" "$BACKEND_DIR"; then
            echo -e "${YELLOW}后端已在运行 (PID: $backend_pid)${NC}"
        else
            rm -f "$BACKEND_PID_FILE"
        fi
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid
        frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if verify_process "$frontend_pid" "$FRONTEND_DIR"; then
            echo -e "${YELLOW}前端已在运行 (PID: $frontend_pid)${NC}"
        else
            rm -f "$FRONTEND_PID_FILE"
        fi
    fi
    
    # 启动后端
    if [ ! -f "$BACKEND_PID_FILE" ]; then
        echo -e "${GREEN}启动后端...${NC}"
        cd "$BACKEND_DIR"
        [ ! -d ".venv" ] && { python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt; }
        source .venv/bin/activate
        
        # 从 .env 文件读取端口配置
        if [ -f ".env" ]; then
            export $(grep -v '^#' .env | grep -E '^(HOST|PORT)=' | xargs)
        fi
        BACKEND_PORT=${PORT:-3000}
        BACKEND_HOST=${HOST:-0.0.0.0}
        
        uvicorn app.main:app --host "$BACKEND_HOST" --port "$BACKEND_PORT" &
        echo $! > "$BACKEND_PID_FILE"
        echo -e "${GREEN}后端已启动: http://localhost:${BACKEND_PORT}${NC}"
    fi
    
    # 启动前端
    if [ ! -f "$FRONTEND_PID_FILE" ]; then
        echo -e "${GREEN}启动前端...${NC}"
        cd "$FRONTEND_DIR"
        [ ! -d "node_modules" ] && npm install
        npm run dev &
        echo $! > "$FRONTEND_PID_FILE"
        echo -e "${GREEN}前端已启动: http://localhost:5174${NC}"
    fi
    
    echo -e "${YELLOW}提示: 按 Ctrl+C 可停止前台进程，后台进程请使用 ./dev.sh stop${NC}"
}

stop() {
    echo -e "${YELLOW}停止服务...${NC}"
    
    safe_kill "$BACKEND_PID_FILE" "$BACKEND_DIR" "后端"
    safe_kill "$FRONTEND_PID_FILE" "$FRONTEND_DIR" "前端"
    
    echo -e "${GREEN}服务已停止${NC}"
}

status() {
    echo -e "=== OpenCraft 服务状态 ==="
    echo ""
    
    local backend_ok=0
    local frontend_ok=0
    
    # 从 .env 读取端口配置
    local backend_port=3000
    if [ -f "$BACKEND_DIR/.env" ]; then
        backend_port=$(grep -v '^#' "$BACKEND_DIR/.env" | grep '^PORT=' | cut -d'=' -f2 || echo "3000")
    fi
    
    check_status "$BACKEND_PID_FILE" "$BACKEND_DIR" "后端" && backend_ok=1
    if [ $backend_ok -eq 1 ]; then
        curl -s "http://localhost:${backend_port}/health" 2>/dev/null && echo "" || echo "(健康检查无响应)"
    fi
    
    check_status "$FRONTEND_PID_FILE" "$FRONTEND_DIR" "前端" && frontend_ok=1
    
    echo ""
    if [ $backend_ok -eq 1 ] && [ $frontend_ok -eq 1 ]; then
        echo -e "状态: ${GREEN}全部运行中${NC}"
    else
        echo -e "状态: ${YELLOW}部分服务未运行${NC}"
    fi
}

case "${1:-start}" in
    start) start ;;
    stop) stop ;;
    status) status ;;
    *) echo "用法: $0 [start|stop|status]" ;;
esac