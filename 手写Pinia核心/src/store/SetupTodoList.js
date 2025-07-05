// import { defineStore } from "pinia";
import { defineStore } from "../mini-pinia";
import { ref, computed } from "vue";

export const useSetupTodoListStore = defineStore("setupTodoList", () => {
    const todoList = ref([
        {
            id: 1,
            content: "学习vue3",
            completed: false,
        },
    ]);
    const count = computed(() => todoList.value.length);

    function addTodo(content) {
        todoList.value.unshift({
            id: new Date().getTime(),
            content,
            completed: false,
        });
    }
    function removeTodo(id) {
        todoList.value = todoList.value.filter((todo) => todo.id != id);
    }
    function toggleTodo(id) {
        todoList.value.forEach((todo) => {
            if (todo.id === id) {
                todo.completed = !todo.completed;
            }
        });
    }
    return {
        todoList,
        count,
        addTodo,
        removeTodo,
        toggleTodo,
    };
});
