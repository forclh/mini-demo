import { isRef } from "vue";

// 参数归一化
export function normalization(args) {
    let id;
    let options;
    let setup;

    if (isString(args[0])) {
        id = args[0];

        if (isFunction(args[1])) {
            setup = args[1];
        } else {
            options = args[1];
        }
    } else {
        options = args[0];
        id = options.id;
    }

    return {
        id,
        options,
        setup,
    };
}

export function isString(value) {
    return typeof value === "string";
}

export function isFunction(value) {
    return typeof value === "function";
}

// TODO判断是否是 computed 计算属性（带有effect属性的ref）
export function isComputed(value) {
    return !!(isRef(value) && value.effect);
}
