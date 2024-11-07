import { createApp } from 'vue'
import App from './App.vue'

// 引入 Ant Design Vue
import Antd from 'ant-design-vue';
// 修改为新的样式引入方式
import 'ant-design-vue/dist/reset.css';

// 引入你的全局样式（如果有的话）
import './style.css'

const app = createApp(App)

// 使用 Ant Design Vue
app.use(Antd)

app.mount('#app')