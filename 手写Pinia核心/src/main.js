import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
// import { createPinia } from "pinia";
import { createPinia } from "@/mini-pinia";

const pinia = createPinia();
console.log(pinia);
createApp(App).use(pinia).mount("#app");
