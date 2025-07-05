import { effectScope, ref } from "vue";
import { piniaSymbol } from "./global";

export function createPinia() {
    const store = new Map(); // 存放所有的store
    const scope = effectScope(true); // 创建作用域统一管理响应式
    const state = scope.run(() => ref({})); // 管理所有的state

    const pinia = {
        install, // vue 插件注册
        store,
        scope,
        state, // pinia 需要直接维护一份 state 便于使用
    };
    return pinia;
}

function install(app) {
    app.provide(piniaSymbol, this);
}
