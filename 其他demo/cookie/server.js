const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

// 中间件配置
app.use(express.json()); // 处理 JSON 格式请求体
app.use(express.urlencoded({ extended: true })); // 处理 URL 编码请求体
app.use(cookieParser()); // 解析Cookie
app.use(
    cors({
        origin: true,
        credentials: true, // 允许发送Cookie
    })
); // 跨域资源共享（CORS）配置

// 静态文件服务
app.use(express.static(path.join(__dirname, "public")));

// 模拟用户数据
const users = {
    admin: { password: "123456", name: "管理员", role: "admin" },
    user1: { password: "password", name: "普通用户", role: "user" },
};

// 模拟购物车数据
let shoppingCarts = {};

// 路由：主页
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API：获取当前所有Cookie
app.get("/api/cookies", (req, res) => {
    console.log("📥 收到获取Cookie请求");
    console.log("请求头中的Cookie:", req.headers.cookie);
    console.log("解析后的Cookie:", req.cookies);

    res.json({
        success: true,
        cookies: req.cookies,
        rawCookies: req.headers.cookie || "",
        message: "成功获取所有Cookie",
    });
});

// API：设置简单Cookie
app.post("/api/set-cookie", (req, res) => {
    const { name, value, expires, httpOnly, secure, sameSite } = req.body;

    console.log(`📤 设置Cookie: ${name}=${value}`);

    if (!name || !value) {
        return res.status(400).json({
            success: false,
            message: "Cookie名称和值不能为空",
        });
    }

    // 构建Cookie选项
    const options = {};

    if (expires && expires !== "session") {
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + parseInt(expires));
        options.expires = expiryDate;
    }

    if (httpOnly) options.httpOnly = true;
    if (secure) options.secure = true;
    if (sameSite) options.sameSite = sameSite;

    // 设置Cookie
    res.cookie(name, value, options);

    res.json({
        success: true,
        message: `Cookie '${name}' 设置成功`,
        cookie: { name, value, options },
    });
});

// API：删除Cookie
app.post("/api/delete-cookie", (req, res) => {
    const { name } = req.body;

    console.log(`🗑️ 删除Cookie: ${name}`);

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Cookie名称不能为空",
        });
    }

    // 删除Cookie（设置为过期）
    res.clearCookie(name);

    res.json({
        success: true,
        message: `Cookie '${name}' 删除成功`,
    });
});

// API：用户登录（演示认证Cookie）
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    console.log(`🔐 用户登录尝试: ${username}`);

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "用户名和密码不能为空",
        });
    }

    const user = users[username];
    if (!user || user.password !== password) {
        return res.status(401).json({
            success: false,
            message: "用户名或密码错误",
        });
    }

    // 设置认证Cookie（HttpOnly，更安全）
    res.cookie("auth_token", `token_${username}_${Date.now()}`, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: "strict",
    });

    // 设置用户信息Cookie（可被前端读取）
    res.cookie(
        "user_info",
        JSON.stringify({
            username: user.name,
            role: user.role,
        }),
        {
            maxAge: 24 * 60 * 60 * 1000,
        }
    );

    res.json({
        success: true,
        message: "登录成功",
        user: {
            username: user.name,
            role: user.role,
        },
    });
});

// API：用户登出
app.post("/api/logout", (req, res) => {
    console.log("🚪 用户登出");

    // 清除认证相关Cookie
    res.clearCookie("auth_token");
    res.clearCookie("user_info");

    res.json({
        success: true,
        message: "登出成功",
    });
});

// API：获取用户信息（需要认证）
app.get("/api/user-info", (req, res) => {
    const authToken = req.cookies.auth_token;

    console.log("👤 获取用户信息请求，认证Token:", authToken);

    if (!authToken) {
        return res.status(401).json({
            success: false,
            message: "未登录，请先登录",
        });
    }

    // 简单的Token验证（实际项目中应该更复杂）
    if (!authToken.startsWith("token_")) {
        return res.status(401).json({
            success: false,
            message: "无效的认证Token",
        });
    }

    const userInfo = req.cookies.user_info;
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            res.json({
                success: true,
                user: user,
                message: "获取用户信息成功",
            });
        } catch (e) {
            res.status(500).json({
                success: false,
                message: "用户信息解析失败",
            });
        }
    } else {
        res.status(401).json({
            success: false,
            message: "用户信息不存在",
        });
    }
});

// API：购物车操作（演示会话管理）
app.post("/api/cart/add", (req, res) => {
    const { productId, productName, price } = req.body;

    // 获取或创建会话ID
    let sessionId = req.cookies.session_id;
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        res.cookie("session_id", sessionId, {
            maxAge: 30 * 60 * 1000, // 30分钟
        });
    }

    console.log(`🛒 添加商品到购物车，会话ID: ${sessionId}`);

    // 初始化购物车
    if (!shoppingCarts[sessionId]) {
        shoppingCarts[sessionId] = [];
    }

    // 添加商品
    const existingItem = shoppingCarts[sessionId].find(
        (item) => item.productId === productId
    );
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        shoppingCarts[sessionId].push({
            productId,
            productName,
            price: parseFloat(price),
            quantity: 1,
        });
    }

    res.json({
        success: true,
        message: "商品添加成功",
        cart: shoppingCarts[sessionId],
        sessionId,
    });
});

// API：获取购物车
app.get("/api/cart", (req, res) => {
    const sessionId = req.cookies.session_id;

    console.log(`🛒 获取购物车，会话ID: ${sessionId}`);

    if (!sessionId || !shoppingCarts[sessionId]) {
        return res.json({
            success: true,
            cart: [],
            message: "购物车为空",
        });
    }

    res.json({
        success: true,
        cart: shoppingCarts[sessionId],
        sessionId,
    });
});

// API：清空购物车
app.post("/api/cart/clear", (req, res) => {
    const sessionId = req.cookies.session_id;

    console.log(`🗑️ 清空购物车，会话ID: ${sessionId}`);

    if (sessionId && shoppingCarts[sessionId]) {
        shoppingCarts[sessionId] = [];
    }

    res.json({
        success: true,
        message: "购物车已清空",
    });
});

// API：设置偏好设置（演示持久化Cookie）
app.post("/api/preferences", (req, res) => {
    const { theme, language, notifications } = req.body;

    console.log("⚙️ 设置用户偏好");

    const preferences = {
        theme: theme || "light",
        language: language || "zh-CN",
        notifications: notifications !== false,
    };

    // 设置长期Cookie（30天）
    res.cookie("user_preferences", JSON.stringify(preferences), {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
        sameSite: "lax",
    });

    res.json({
        success: true,
        message: "偏好设置保存成功",
        preferences,
    });
});

// API：获取偏好设置
app.get("/api/preferences", (req, res) => {
    const preferencesStr = req.cookies.user_preferences;

    console.log("⚙️ 获取用户偏好");

    let preferences = {
        theme: "light",
        language: "zh-CN",
        notifications: true,
    };

    if (preferencesStr) {
        try {
            preferences = JSON.parse(preferencesStr);
        } catch (e) {
            console.error("偏好设置解析失败:", e);
        }
    }

    res.json({
        success: true,
        preferences,
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error("服务器错误:", err);
    res.status(500).json({
        success: false,
        message: "服务器内部错误",
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log("🍪 Cookie 前后端交互演示服务器启动成功!");
    console.log(`📍 服务器地址: http://localhost:${PORT}`);
    console.log(`🌐 请在浏览器中打开: http://localhost:${PORT}`);
    console.log("⏹️  按 Ctrl+C 停止服务器");
    console.log("-".repeat(50));
});

// 优雅关闭
process.on("SIGINT", () => {
    console.log("\n🛑 服务器正在关闭...");
    process.exit(0);
});
