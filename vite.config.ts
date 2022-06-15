import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import presetUno from '@unocss/preset-uno'
import presetIcons from '@unocss/preset-icons'

export default defineConfig({
  plugins: [
    vue(),
    Unocss({
      presets: [presetUno(), presetIcons()]
    }),
  ]
})