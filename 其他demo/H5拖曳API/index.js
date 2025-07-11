// 事件日志功能
const eventLog = document.getElementById("eventLog");

function logEvent(message) {
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    eventLog.appendChild(logEntry);
    eventLog.scrollTop = eventLog.scrollHeight;
}

// 1. 基本拖曳功能
const draggableItems = document.querySelectorAll(".draggable-item");
const dropZone1 = document.getElementById("dropZone1");

draggableItems.forEach((item) => {
    item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.dataset.item);
        e.target.classList.add("dragging");
        logEvent(`开始拖曳: ${e.target.textContent}`);
    });

    item.addEventListener("dragend", (e) => {
        e.target.classList.remove("dragging");
        logEvent(`拖曳结束: ${e.target.textContent}`);
    });
});

dropZone1.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone1.classList.add("drag-over");
});

dropZone1.addEventListener("dragleave", () => {
    dropZone1.classList.remove("drag-over");
});

dropZone1.addEventListener("drop", (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    dropZone1.classList.remove("drag-over");
    dropZone1.innerHTML = `<div class="drop-zone-text">✅ 成功放置: ${data}</div>`;
    logEvent(`元素已放置到基本拖曳区域: ${data}`);
});

// 2. 列表排序功能
// 获取可排序列表容器元素
const sortableList = document.getElementById("sortableList");
// 存储当前被拖拽的元素
let draggedElement = null;

// 监听拖拽开始事件（事件委托）
sortableList.addEventListener("dragstart", (e) => {
    // 检查被拖拽的元素是否包含sortable-item类
    if (e.target.classList.contains("sortable-item")) {
        // 保存被拖拽的元素引用
        draggedElement = e.target;
        // 为被拖拽元素添加dragging样式类
        e.target.classList.add("dragging");
        // 记录拖拽开始事件
        logEvent(`开始排序拖曳: ${e.target.textContent}`);
    }
});

// 监听拖拽结束事件（事件委托）
sortableList.addEventListener("dragend", (e) => {
    // 检查拖拽结束的元素是否包含sortable-item类
    if (e.target.classList.contains("sortable-item")) {
        // 移除dragging样式类
        e.target.classList.remove("dragging");
        // 清空被拖拽元素的引用
        draggedElement = null;
    }
});

// 监听拖拽悬停事件（事件委托、在拖拽过程中持续触发）
sortableList.addEventListener("dragover", (e) => {
    // 阻止默认行为，允许放置操作
    e.preventDefault();
    // 根据鼠标Y坐标获取应该插入位置的下一个元素
    const afterElement = getDragAfterElement(sortableList, e.clientY);
    // 如果没有找到下一个元素，说明应该插入到列表末尾
    if (afterElement == null) {
        sortableList.appendChild(draggedElement);
    } else {
        // 在找到的元素之前插入被拖拽的元素
        sortableList.insertBefore(draggedElement, afterElement);
    }
});

/**
 * 计算拖曳元素应该插入的位置（在哪个元素之后）
 * 这是实现拖曳排序的核心算法
 *
 * @param {HTMLElement} container - 包含可排序元素的容器
 * @param {number} y - 鼠标的Y坐标位置
 * @returns {HTMLElement|null} 应该插入位置的下一个元素，如果返回null则插入到末尾
 */
function getDragAfterElement(container, y) {
    // 获取容器中所有可拖曳的元素，排除当前正在拖曳的元素
    // 使用:not(.dragging)选择器避免包含当前拖曳的元素
    const draggableElements = [
        ...container.querySelectorAll(".sortable-item:not(.dragging)"),
    ];

    // 使用reduce方法找到最接近鼠标位置的元素
    return draggableElements.reduce(
        (closest, child) => {
            // 获取当前元素的位置和尺寸信息
            const box = child.getBoundingClientRect();

            // 计算鼠标Y坐标与元素中心点的偏移量
            // 负值表示鼠标在元素上方，正值表示在元素下方
            const offset = y - box.top - box.height / 2;

            // 只考虑鼠标在元素上方的情况（offset < 0）
            // 在这些元素中找到距离鼠标最近的一个（offset最大的负值）
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        },
        // 初始值：使用负无穷大确保任何负offset都会被选中
        { offset: Number.NEGATIVE_INFINITY }
    ).element; // 返回找到的元素，如果没找到则返回undefined（相当于null）
}

// 3. 文件拖曳功能
// 获取文件拖拽区域和文件信息显示区域的DOM元素
const fileDropZone = document.getElementById("fileDropZone");
const fileInfo = document.getElementById("fileInfo");

// 监听文件拖拽悬停事件
fileDropZone.addEventListener("dragover", (e) => {
    // 阻止默认行为，允许文件放置
    e.preventDefault();
    // 添加拖拽悬停样式
    fileDropZone.classList.add("drag-over");
});

// 监听拖拽离开事件
fileDropZone.addEventListener("dragleave", () => {
    // 移除拖拽悬停样式
    fileDropZone.classList.remove("drag-over");
});

// 监听文件放置事件
fileDropZone.addEventListener("drop", (e) => {
    // 阻止默认行为（如在浏览器中打开文件）
    e.preventDefault();
    // 移除拖拽悬停样式
    fileDropZone.classList.remove("drag-over");

    // 获取拖拽的文件列表
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // 获取第一个文件
        const file = files[0];
        // 显示文件信息区域
        fileInfo.style.display = "block";
        // 动态生成文件信息HTML内容
        fileInfo.innerHTML = `
                    <h4>📄 文件信息：</h4>
                    <p><strong>文件名：</strong> ${file.name}</p>
                    <p><strong>文件大小：</strong> ${(file.size / 1024).toFixed(
                        2
                    )} KB</p>
                    <p><strong>文件类型：</strong> ${file.type || "未知"}</p>
                    <p><strong>最后修改：</strong> ${new Date(
                        file.lastModified
                    ).toLocaleString()}</p>
                `;
        // 记录文件拖拽成功事件
        logEvent(
            `文件拖曳成功: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
        );
    }
});

// 4. 购物车功能
// 获取所有商品元素和购物车容器
const products = document.querySelectorAll(".product");
const shoppingCart = document.getElementById("shoppingCart");

// 为每个商品添加拖拽开始事件监听器
products.forEach((product) => {
    product.addEventListener("dragstart", (e) => {
        // 将商品ID存储到dataTransfer中，用于后续识别
        e.dataTransfer.setData("text/plain", e.target.dataset.product);
        // 记录商品拖拽开始事件
        logEvent(`开始拖曳商品: ${e.target.querySelector("h4").textContent}`);
    });
});

// 监听购物车拖拽悬停事件
shoppingCart.addEventListener("dragover", (e) => {
    // 阻止默认行为，允许商品放置
    e.preventDefault();
    // 添加拖拽悬停样式
    shoppingCart.classList.add("drag-over");
});

// 监听购物车拖拽离开事件
shoppingCart.addEventListener("dragleave", () => {
    // 移除拖拽悬停样式
    shoppingCart.classList.remove("drag-over");
});

// 监听购物车商品放置事件
shoppingCart.addEventListener("drop", (e) => {
    // 阻止默认行为
    e.preventDefault();
    // 从dataTransfer中获取商品ID
    const productId = e.dataTransfer.getData("text/plain");
    // 根据商品ID查找对应的商品元素
    const productElement = document.querySelector(
        `[data-product="${productId}"]`
    );

    if (productElement) {
        // 提取商品信息
        const productName = productElement.querySelector("h4").textContent;
        const productPrice = productElement.querySelector("p").textContent;
        const productIcon =
            productElement.querySelector(".product.img").textContent;

        // 检查商品是否已经在购物车中（避免重复添加）
        const existingItem = shoppingCart.querySelector(
            `[data-cart-product="${productId}"]`
        );
        if (!existingItem) {
            // 创建新的购物车项目元素
            const cartItem = document.createElement("div");
            cartItem.className = "cart-item";
            cartItem.dataset.cartProduct = productId;
            // 设置购物车项目的HTML内容
            cartItem.innerHTML = `
                        <span style="font-size: 1.5em;">${productIcon}</span>
                        <div>
                            <strong>${productName}</strong><br>
                            <small>${productPrice}</small>
                        </div>
                    `;

            // 移除购物车的默认提示文本
            const defaultText = shoppingCart.querySelector(".drop-zone-text");
            if (defaultText) {
                defaultText.remove();
            }

            // 将商品添加到购物车
            shoppingCart.appendChild(cartItem);
            logEvent(`商品已添加到购物车: ${productName}`);
        } else {
            // 商品已存在，记录重复添加事件
            logEvent(`商品已在购物车中: ${productName}`);
        }
    }

    // 移除拖拽悬停样式
    shoppingCart.classList.remove("drag-over");
});

// 防止页面默认的拖曳行为
document.addEventListener("dragover", (e) => {
    e.preventDefault();
});

document.addEventListener("drop", (e) => {
    e.preventDefault();
});

logEvent("HTML5 拖曳API Demo 已准备就绪！");
