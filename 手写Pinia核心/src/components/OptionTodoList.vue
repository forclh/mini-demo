<template>
    <div>
        <h1>OptionTodoList</h1>
        <input type="text" v-model="content" />
        <button @click="addHandler">ADD</button>
        <p>共{{ todoListStore.count }}条</p>
        <ul>
            <li v-for="todo in todoListStore.todoList" :key="todo.id">
                <input
                    type="checkbox"
                    :checked="todo.completed"
                    @change="todoListStore.toggleTodo(todo.id)"
                />
                <span
                    :style="{
                        textDecoration: todo.completed
                            ? 'line-through'
                            : 'none',
                    }"
                    >{{ todo.content }}</span
                >
                <button @click="todoListStore.removeTodo(todo.id)">
                    REMOVE
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useOptionTodoListStore } from "@/store/OptionTodoList.js";
const todoListStore = useOptionTodoListStore();

const content = ref("");

const addHandler = () => {
    todoListStore.addTodo(content.value);
    content.value = "";
};
</script>
