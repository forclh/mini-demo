// Cookie 前后端交互演示 - 前端JavaScript

// 全局配置
const API_BASE = "";
const STATUS_BAR = document.getElementById("statusBar");

// 工具函数
function updateStatus(message, type = "info") {
    const timestamp = new Date().toLocaleTimeString();
    const statusColors = {
        info: "#2c3e50",
        success: "#27ae60",
        error: "#e74c3c",
        warning: "#f39c12",
    };

    STATUS_BAR.style.backgroundColor = statusColors[type] || statusColors.info;
    STATUS_BAR.textContent = `[${timestamp}] ${message}`;
}

// HTTP请求封装
async function apiRequest(url, options = {}) {
    try {
        const defaultOptions = {
            credentials: "include", // TDDO重要：包含Cookie
            headers: {
                "Content-Type": "application/json",
            },
        };

        const response = await fetch(API_BASE + url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error("API请求失败:", error);
        updateStatus(`请求失败: ${error.message}`, "error");
        throw error;
    }
}

// 标签页切换
function showTab(tabName) {
    // 隐藏所有标签页内容
    document.querySelectorAll(".tab-content").forEach((content) => {
        content.classList.remove("active");
    });

    // 移除所有标签的active类
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.remove("active");
    });

    // 显示选中的标签页
    document.getElementById(tabName).classList.add("active");
    // 使用事件参数来获取目标元素
    document
        .querySelector(`[onclick="showTab('${tabName}')"]`)
        .classList.add("active");

    // 根据标签页自动加载相关数据
    switch (tabName) {
        case "auth":
            getUserInfo();
            break;
        case "session":
            getCart();
            break;
        case "preferences":
            loadPreferences();
            break;
        case "monitor":
            refreshCookieMonitor();
            break;
    }
}

// ==================== 基础Cookie操作 ====================

// 在服务器端设置Cookie
async function setCookieOnServer() {
    const name = document.getElementById("cookieName").value.trim();
    const value = document.getElementById("cookieValue").value.trim();
    const expires = document.getElementById("cookieExpires").value;
    const httpOnly = document.getElementById("httpOnly").checked;
    const secure = document.getElementById("secure").checked;

    if (!name || !value) {
        alert("请输入Cookie名称和值！");
        return;
    }

    try {
        const response = await apiRequest("/api/set-cookie", {
            method: "POST",
            body: JSON.stringify({
                name,
                value,
                expires,
                httpOnly,
                secure,
                sameSite: "lax",
            }),
        });

        updateStatus(response.message, "success");

        // 清空表单
        document.getElementById("cookieName").value = "";
        document.getElementById("cookieValue").value = "";

        // 自动刷新Cookie显示
        getCookiesFromServer();
    } catch (error) {
        console.error("设置Cookie失败:", error);
    }
}

// 删除服务器端Cookie
async function deleteCookieOnServer() {
    const name = document.getElementById("cookieName").value.trim();

    if (!name) {
        alert("请输入要删除的Cookie名称！");
        return;
    }

    try {
        const response = await apiRequest("/api/delete-cookie", {
            method: "POST",
            body: JSON.stringify({ name }),
        });

        updateStatus(response.message, "success");

        // 清空表单
        document.getElementById("cookieName").value = "";

        // 自动刷新Cookie显示
        getCookiesFromServer();
    } catch (error) {
        console.error("删除Cookie失败:", error);
    }
}

// 从服务器获取Cookie
async function getCookiesFromServer() {
    try {
        const response = await apiRequest("/api/cookies");

        const display = document.getElementById("cookieDisplay");
        let content = "=== 服务器端Cookie信息 ===\n\n";

        content += `原始Cookie字符串: ${response.rawCookies || "(空)"}\n\n`;

        if (Object.keys(response.cookies).length > 0) {
            content += "解析后的Cookie:\n";
            for (const [name, value] of Object.entries(response.cookies)) {
                content += `  ${name} = ${value}\n`;
            }
        } else {
            content += "当前没有Cookie\n";
        }

        display.textContent = content;
        updateStatus("成功获取服务器端Cookie", "success");
    } catch (error) {
        console.error("获取服务器Cookie失败:", error);
    }
}

// 从客户端获取Cookie
function getCookiesFromClient() {
    const display = document.getElementById("cookieDisplay");
    let content = "=== 客户端Cookie信息 ===\n\n";

    const cookies = document.cookie;
    content += `原始Cookie字符串: ${cookies || "(空)"}\n\n`;

    if (cookies) {
        content += "解析后的Cookie:\n";
        const cookieArray = cookies.split(";");
        cookieArray.forEach((cookie) => {
            const [name, value] = cookie.trim().split("=");
            content += `  ${name} = ${decodeURIComponent(value || "")}\n`;
        });
    } else {
        content += "当前没有客户端可访问的Cookie\n";
    }

    content += "\n注意: 客户端JavaScript无法访问HttpOnly Cookie";

    display.textContent = content;
    updateStatus("成功获取客户端Cookie", "success");
}

// ==================== 用户认证 ====================

// 用户登录
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("请输入用户名和密码！");
        return;
    }

    try {
        const response = await apiRequest("/api/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });

        updateStatus(response.message, "success");

        // 清空密码字段
        document.getElementById("password").value = "";

        // 更新用户状态显示
        updateUserStatus(response.user);

        // 自动获取用户信息
        setTimeout(getUserInfo, 500);
    } catch (error) {
        console.error("登录失败:", error);
        updateUserStatus(null, error.message);
    }
}

// 用户登出
async function logout() {
    try {
        const response = await apiRequest("/api/logout", {
            method: "POST",
        });

        updateStatus(response.message, "success");

        // 清空用户状态
        updateUserStatus(null);

        // 清空认证显示
        document.getElementById("authDisplay").textContent = "已登出";
    } catch (error) {
        console.error("登出失败:", error);
    }
}

// 获取用户信息
async function getUserInfo() {
    try {
        const response = await apiRequest("/api/user-info");

        const display = document.getElementById("authDisplay");
        let content = "=== 用户认证信息 ===\n\n";
        content += `用户名: ${response.user.username}\n`;
        content += `角色: ${response.user.role}\n`;
        content += `状态: 已登录\n`;
        content += `消息: ${response.message}\n`;

        display.textContent = content;
        updateUserStatus(response.user);
        updateStatus("成功获取用户信息", "success");
    } catch (error) {
        const display = document.getElementById("authDisplay");
        display.textContent = `认证失败: ${error.message}`;
        updateUserStatus(null, error.message);
        console.error("获取用户信息失败:", error);
    }
}

// 更新用户状态显示
function updateUserStatus(user, errorMessage = null) {
    const statusDiv = document.getElementById("userStatus");

    if (user) {
        statusDiv.innerHTML = `
            <div class="user-info">
                ✅ 已登录: ${user.username} (${user.role})
            </div>
        `;
    } else if (errorMessage) {
        statusDiv.innerHTML = `
            <div class="error-info">
                ❌ ${errorMessage}
            </div>
        `;
    } else {
        statusDiv.innerHTML = `
            <div class="error-info">
                ⚠️ 未登录
            </div>
        `;
    }
}

// ==================== 会话管理 ====================

// 添加商品到购物车
async function addToCart(productId, productName, price) {
    try {
        const response = await apiRequest("/api/cart/add", {
            method: "POST",
            body: JSON.stringify({
                productId,
                productName,
                price,
            }),
        });

        updateStatus(response.message, "success");

        // 自动刷新购物车显示
        displayCart(response.cart, response.sessionId);
    } catch (error) {
        console.error("添加到购物车失败:", error);
    }
}

// 获取购物车
async function getCart() {
    try {
        const response = await apiRequest("/api/cart");

        displayCart(response.cart, response.sessionId);
        updateStatus("成功获取购物车信息", "success");
    } catch (error) {
        console.error("获取购物车失败:", error);
    }
}

// 清空购物车
async function clearCart() {
    try {
        const response = await apiRequest("/api/cart/clear", {
            method: "POST",
        });

        updateStatus(response.message, "success");

        // 刷新购物车显示
        getCart();
    } catch (error) {
        console.error("清空购物车失败:", error);
    }
}

// 显示购物车内容
function displayCart(cart, sessionId) {
    const display = document.getElementById("cartDisplay");
    let content = "=== 购物车信息 ===\n\n";

    if (sessionId) {
        content += `会话ID: ${sessionId}\n\n`;
    }

    if (cart && cart.length > 0) {
        let total = 0;
        content += "商品列表:\n";
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            content += `${index + 1}. ${item.productName} - ¥${item.price} × ${
                item.quantity
            } = ¥${itemTotal.toFixed(2)}\n`;
            total += itemTotal;
        });
        content += `\n总计: ¥${total.toFixed(2)}`;
    } else {
        content += "购物车为空";
    }

    display.textContent = content;
}

// ==================== 偏好设置 ====================

// 保存偏好设置
async function savePreferences() {
    const theme = document.getElementById("theme").value;
    const language = document.getElementById("language").value;
    const notifications = document.getElementById("notifications").checked;

    try {
        const response = await apiRequest("/api/preferences", {
            method: "POST",
            body: JSON.stringify({
                theme,
                language,
                notifications,
            }),
        });

        updateStatus(response.message, "success");

        // 自动加载偏好显示
        displayPreferences(response.preferences);
    } catch (error) {
        console.error("保存偏好设置失败:", error);
    }
}

// 加载偏好设置
async function loadPreferences() {
    try {
        const response = await apiRequest("/api/preferences");

        // 更新表单
        document.getElementById("theme").value = response.preferences.theme;
        document.getElementById("language").value =
            response.preferences.language;
        document.getElementById("notifications").checked =
            response.preferences.notifications;

        // 显示偏好
        displayPreferences(response.preferences);
        updateStatus("成功加载偏好设置", "success");
    } catch (error) {
        console.error("加载偏好设置失败:", error);
    }
}

// 显示偏好设置
function displayPreferences(preferences) {
    const display = document.getElementById("preferencesDisplay");
    let content = "=== 当前偏好设置 ===\n\n";

    const themeNames = {
        light: "浅色主题",
        dark: "深色主题",
        auto: "自动",
    };

    const languageNames = {
        "zh-CN": "中文",
        "en-US": "English",
        "ja-JP": "日本語",
    };

    content += `主题: ${themeNames[preferences.theme] || preferences.theme}\n`;
    content += `语言: ${
        languageNames[preferences.language] || preferences.language
    }\n`;
    content += `通知: ${preferences.notifications ? "启用" : "禁用"}\n`;

    display.textContent = content;
}

// ==================== Cookie监控 ====================

// 刷新Cookie监控
async function refreshCookieMonitor() {
    // 获取客户端Cookie
    const clientCookies = document.cookie;
    const clientDisplay = document.getElementById("clientCookies");

    if (clientCookies) {
        let content = "";
        const cookieArray = clientCookies.split(";");
        cookieArray.forEach((cookie) => {
            const [name, value] = cookie.trim().split("=");
            content += `${name} = ${decodeURIComponent(value || "")}\n`;
        });
        clientDisplay.textContent = content || "无客户端可访问的Cookie";
    } else {
        clientDisplay.textContent = "无客户端可访问的Cookie";
    }

    // 获取服务器端Cookie
    try {
        const response = await apiRequest("/api/cookies");
        const serverDisplay = document.getElementById("serverCookies");

        if (Object.keys(response.cookies).length > 0) {
            let content = "";
            for (const [name, value] of Object.entries(response.cookies)) {
                content += `${name} = ${value}\n`;
            }
            serverDisplay.textContent = content;
        } else {
            serverDisplay.textContent = "无服务器端Cookie";
        }

        // 显示详细信息
        const detailsDisplay = document.getElementById("cookieDetails");
        let details = "=== Cookie详细分析 ===\n\n";
        details += `原始Cookie字符串: ${response.rawCookies || "(空)"}\n\n`;
        details += `客户端可访问Cookie数量: ${
            clientCookies ? clientCookies.split(";").length : 0
        }\n`;
        details += `服务器端Cookie数量: ${
            Object.keys(response.cookies).length
        }\n\n`;

        // 分析Cookie类型
        const allCookieNames = new Set();
        if (clientCookies) {
            clientCookies.split(";").forEach((cookie) => {
                const name = cookie.trim().split("=")[0];
                allCookieNames.add(name);
            });
        }
        Object.keys(response.cookies).forEach((name) =>
            allCookieNames.add(name)
        );

        details += "Cookie分类:\n";
        allCookieNames.forEach((name) => {
            const inClient =
                clientCookies && clientCookies.includes(name + "=");
            const inServer = response.cookies.hasOwnProperty(name);

            if (inClient && inServer) {
                details += `  ${name}: 普通Cookie (客户端+服务器端可访问)\n`;
            } else if (!inClient && inServer) {
                details += `  ${name}: HttpOnly Cookie (仅服务器端可访问)\n`;
            } else if (inClient && !inServer) {
                details += `  ${name}: 客户端设置的Cookie\n`;
            }
        });

        detailsDisplay.textContent = details;
        updateStatus("Cookie监控刷新完成", "success");
    } catch (error) {
        console.error("刷新Cookie监控失败:", error);
    }
}

// 清除所有Cookie
function clearAllCookies() {
    if (
        !confirm(
            "确定要清除所有客户端Cookie吗？\n\n注意：这只会清除客户端可访问的Cookie，HttpOnly Cookie需要通过服务器清除。"
        )
    ) {
        return;
    }

    // 清除客户端Cookie
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    });

    updateStatus("客户端Cookie已清除", "warning");

    // 刷新监控显示
    setTimeout(refreshCookieMonitor, 500);
}

// ==================== 页面初始化 ====================

// 页面加载完成后的初始化
document.addEventListener("DOMContentLoaded", function () {
    updateStatus("页面加载完成，正在初始化...", "info");

    // 测试服务器连接
    getCookiesFromServer()
        .then(() => {
            updateStatus("服务器连接成功", "success");
        })
        .catch(() => {
            updateStatus("服务器连接失败，请检查后端服务是否启动", "error");
        });

    // 初始化监控面板
    refreshCookieMonitor();

    // 添加键盘事件监听
    document
        .getElementById("cookieName")
        .addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                document.getElementById("cookieValue").focus();
            }
        });

    document
        .getElementById("cookieValue")
        .addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                setCookieOnServer();
            }
        });

    document
        .getElementById("username")
        .addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                document.getElementById("password").focus();
            }
        });

    document
        .getElementById("password")
        .addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                login();
            }
        });

    console.log("🍪 Cookie前后端交互演示已初始化");
    console.log("💡 提示: 打开开发者工具的Network标签可以观察Cookie的传输过程");
});

// 定期刷新监控（每30秒）
setInterval(() => {
    if (document.getElementById("monitor").classList.contains("active")) {
        refreshCookieMonitor();
    }
}, 30000);
