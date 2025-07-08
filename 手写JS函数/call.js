/**
 * =====================================================
 * 1. call 函数定义的位置
 * 2. 确定函数的输入和输入
 * =====================================================
 */
Function.prototype.myCall = function (context, ...args) {
  context.fn = this; // 拿到调用的函数，并更改指向
  const result = context.fn(...args);
  delete context.fn; // 删除添加的属性
  return result;
};

/**
 * =====================================================
 * 3. 解决属性重名（传递的上下文对象context可能本身就有fn属性）
 * =====================================================
 */
Function.prototype.myCall = function (context, ...args) {
  const key = Symbol("call"); // 通过 Symbol 创建唯一键
  context[key] = this; // 拿到调用的函数，并更改指向
  const result = context[key](...args);
  delete context[key];
  return result;
};

/**
 * =====================================================
 * 4. 解决 method 函数中打印 this 时出现定义的key函数
 * =====================================================
 */
Function.prototype.myCall = function (context, ...args) {
  const key = Symbol("call");
  Object.defineProperty(context, key, {
    value: this,
    enumerable: false, // 设置该属性不可被枚举
    configurable: true, // 设置该属性为可以配置，使得后续可以删除
  });
  const result = context[key](...args);
  delete context[key];
  return result;
};

/**
 * =====================================================
 *  5. 解决context为非对象的情况（null, undefined, 原始值）
 * =====================================================
 */
Function.prototype.myCall = function (context, ...args) {
  if (context === null || context === undefined) {
    context = globalThis; // globalThis表示全局对象（浏览器：window，Node：global）
  } else {
    context = Object(context); // 原始值会被转换为对应的包装对象
  }

  const key = Symbol("call");
  Object.defineProperty(context, key, {
    value: this,
    enumerable: false,
    configurable: true,
  });
  const result = context[key](...args);
  delete context[key];
  return result;
};

// 测试用例
function runTests() {
  console.log("===== myCall 方法测试 =====");

  // 测试用例1：基本功能 - 改变this指向到普通对象
  function testBasic(a, b) {
    console.log("测试1 - 基本功能：");
    console.log("参数:", a, b);
    console.log("this:", this);
    console.log("name属性:", this.name);
    console.log("-----------------");
    return a + b;
  }

  const result1 = testBasic.myCall({ name: "测试对象" }, 10, 20);
  console.log("返回值:", result1);
  console.log();

  // 测试用例2：传入null或undefined时，this指向全局对象
  function testNullUndefined() {
    console.log("测试2 - null/undefined:");
    console.log("this === globalThis:", this === globalThis);
    console.log("-----------------");
  }

  testNullUndefined.myCall(null);
  testNullUndefined.myCall(undefined);
  console.log();

  // 测试用例3：传入原始值时会被转换为对应的包装对象
  function testPrimitive() {
    console.log("测试3 - 原始值转换:");
    console.log("this类型:", typeof this);
    console.log("this值:", this);
    console.log("-----------------");
  }

  testPrimitive.myCall(123); // 数字
  testPrimitive.myCall("hello"); // 字符串
  testPrimitive.myCall(true); // 布尔值
  console.log();

  // 测试用例4：处理已有同名属性的对象
  function testPropertyConflict() {
    console.log("测试4 - 属性冲突:");
    console.log("this.fn:", this.fn);
    console.log("this.customProp:", this.customProp);
    console.log("-----------------");
  }

  const objWithFn = {
    fn: "原始fn属性",
    customProp: "自定义属性",
  };

  testPropertyConflict.myCall(objWithFn);
  console.log("调用后对象的fn属性:", objWithFn.fn); // 应该保持不变
  console.log();
}

// 运行所有测试
runTests();
