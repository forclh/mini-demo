/**
 * =====================================================
 * 1. call 函数定义的位置
 * 2. 确定函数的输入和输入
 * =====================================================
 */
Function.prototype.myBind = function (context, ...args) {
    return function (...resArgs) {};
};

/**
 * =====================================================
 * 3. 确定新函数的this指向和返回值
 * =====================================================
 */
Function.prototype.myBind = function (context, ...args) {
    const fn = this; // 获取原始函数
    return function (...resArgs) {
        return fn.call(context, ...args, ...resArgs); // 利用call改变 this 指向
    };
};

/**
 * =====================================================
 * 4. 处理使用new关键字调用新函数的情况
 * =====================================================
 */
Function.prototype.myBind = function (context, ...args) {
    const fn = this;
    return function newFn(...resArgs) {
        // 判断是否是使用new关键字调用
        if (Object.getPrototypeOf(this) === newFn.prototype) {
            return new fn(...args, ...resArgs);
        } else {
            // 正常调用
            return fn.call(context, ...args, ...resArgs);
        }
    };
};

// 测试基本功能
function greet(greeting, punctuation) {
    return greeting + " " + this.name + punctuation;
}

const person = { name: "Alice" };
const boundGreet = greet.myBind(person, "Hello");
console.log(boundGreet("!")); // "Hello Alice!"

// 测试new操作符
function Person(name, age) {
    this.name = name;
    this.age = age;
}

const BoundPerson = Person.myBind(null, "Bob");
const bob = new BoundPerson(25);
console.log(bob.name); // "Bob"
console.log(bob.age); // 25

// 测试参数合并
function sum(a, b, c) {
    return a + b + c;
}

const boundSum = sum.myBind(null, 1, 2);
console.log(boundSum(3)); // 6
