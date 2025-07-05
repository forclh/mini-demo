import {
    inject,
    isReactive,
    reactive,
    effectScope,
    isRef,
    computed,
    ref,
} from "vue";
import { normalization } from "./utils";
import { piniaSymbol } from "./global";
import { isFunction, isComputed } from "./utils";

/**
 * 参数的情况有三种：
 * 1. options: defineStore({id, state, ...})
 * 2. id + options: defineStore(id, {state, ...})
 * 3. id + setup: defineStore(id, () => {})
 */
export function defineStore(...args) {
    const { id, options, setup } = normalization(args);

    const isSetup = isFunction(setup);

    function useStore() {
        const pinia = inject(piniaSymbol);
        // 判断是否以及存在 store
        if (!pinia.store.get(id)) {
            // 没有 store 就创建
            // 判断是 setup 还是 options
            if (isSetup) {
                createSetupStore(pinia, id, setup); // setup 方式创建store
            } else {
                createOptionStore(pinia, id, options); // options方式创建store
            }
        }
        // 返回 id 对应的 store
        return pinia.store.get(id);
    }
    return useStore;
}

/**
 * 创建setup方式的store
 * @param {*} pinia pinia实例
 * @param {*} id store 的id
 * @param {*} setup setup函数
 */
function createSetupStore(pinia, id, setup) {
    const setupStore = setup();

    // 需要对 state 进行处理
    const result = pinia.scope.run(() => {
        let storeScope = effectScope(true); // 创建子作用域，未来可以单独调用 stop 方法
        return storeScope.run(() => compileSetup(pinia, id, setupStore));
    });

    const store = reactive({});
    // 合并store
    Object.assign(store, result); // 使用Object.assign 将result的属性合并到store，保持store的响应式
    pinia.store.set(id, store); // 存储store
    return store; // 可选
}

/**
 * 对state进行额外编译
 * 因为pinia需要直接维护一份state便于使用
 * state的形式为 {
 *   optionTodoList: {
 *      todoList: ref([])
 *   },
 *   setupTodoList: {
 *      todoList: ref([])
 *   }
 * }
 */
function compileSetup(pinia, id, setupStore) {
    // 判断 pinia.state 中是否已有当前 id 对应的仓库的 state（pinia.state 是 ref）
    if (!pinia.state.value[id]) {
        // 如果没有则创建
        pinia.state.value[id] = {};

        for (let key in setupStore) {
            const el = setupStore[key];
            // 判断是否是state
            // 由于computed也是ref因此需要排除
            if ((isRef(el) && !isComputed(el)) || isReactive(el)) {
                // 说明是state
                pinia.state.value[id][key] = el;
            }
        }
    }

    return {
        ...setupStore,
    };
}

/**
 * 创建 options 方式的 store
 * @param {*} pinia pinia实例
 * @param {*} id store的id
 * @param {*} options 选项
 */
function createOptionStore(pinia, id, options) {
    const store = reactive({});
    // 作用域处理
    const result = pinia.scope.run(() => {
        let storeScope = effectScope();
        return storeScope.run(() => {
            return compileOptions(pinia, id, options, store);
        });
    });

    Object.assign(store, result);
    pinia.store.set(id, store);
    return store;
}

function compileOptions(pinia, id, options, store) {
    const { state, getters, actions } = options;
    // state: 是个函数，需要将返回的对象中的每个数据利用 ref 包装成响应式; 同时在 pinia.state 中处理
    // getters： 将每个 getters 处理成一个 computed; this 处理
    // actions:  this 处理
    const storeState = createStoreState(pinia, id, state);
    const storeGetters = createStoreGetters(store, getters);
    const storeActions = createStoreActions(store, actions);

    return {
        ...storeState,
        ...storeGetters,
        ...storeActions,
    };
}

function createStoreState(pinia, id, state) {
    /**
     *  state: () => ({
            todoList: [
                {
                    id: 1,
                    content: "学习vue3",
                    completed: false,
                },
            ],
        })
     */
    // 1. 修改 state 为响应式
    const storeState = state ? state() : {};
    for (let stateName in storeState) {
        storeState[stateName] = ref(storeState[stateName]);
    }
    // 2. 在 pinia.state 中保存
    if (!pinia.state.value[id]) {
        pinia.state.value[id] = storeState; // 就算没有 state 也要保存空对象
    }

    return storeState;
}

function createStoreGetters(store, getters) {
    /**
     *  getters: {
            count() {
                return this.todoList.length;
            },
        },
     */
    // 1. 将 getters 的每一项变成一个 computed, computed(() => count.call(store))
    const storeGetters = {};
    if (!getters) return storeGetters; // 如果 getters 为空或未定义，直接返回空对象

    for (let getterName in getters) {
        storeGetters[getterName] = computed(() =>
            getters[getterName].call(store)
        );
    }

    return storeGetters;
}

function createStoreActions(store, actions) {
    const storeActions = {};
    if (!actions) return storeActions;
    for (let actionName in actions) {
        // storeActions[actionName] = actions[actionName].bind(store);
        storeActions[actionName] = function (...args) {
            return actions[actionName].apply(store, args);
        };
    }

    return storeActions;
}
