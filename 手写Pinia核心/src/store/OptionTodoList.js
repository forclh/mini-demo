// import { defineStore } from "pinia";
import { defineStore } from "../mini-pinia";

export const useOptionTodoListStore = defineStore("optionTodoList", {
    state: () => ({
        todoList: [
            {
                id: 1,
                content: "学习vue3",
                completed: false,
            },
        ],
    }),
    getters: {
        count() {
            return this.todoList.length;
        },
    },
    actions: {
        addTodo(content) {
            this.todoList.unshift({
                // TODO
                id: new Date().getTime(),
                content,
                completed: false,
            });
        },
        removeTodo(id) {
            this.todoList = this.todoList.filter((todo) => todo.id != id);
        },
        toggleTodo(id) {
            this.todoList.forEach((todo) => {
                if (todo.id === id) {
                    todo.completed = !todo.completed;
                }
            });
        },
    },
});
