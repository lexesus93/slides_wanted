import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Алиасы для импортов
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  
  // Конфигурация сервера разработки
  server: {
    port: 3001,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      port: 3002
    },
    // Проксирование API запросов к backend
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://backend:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  
  // Настройки сборки
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          fabric: ['fabric'],
          antd: ['antd', '@ant-design/icons'],
          utils: ['lodash-es', 'uuid', 'classnames']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  // Настройки для тестирования
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true
  },
  
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'fabric',
      'antd',
      '@ant-design/icons',
      'socket.io-client',
      'zustand',
      '@tanstack/react-query',
      'axios',
      'react-router-dom'
    ],
    exclude: ['@shared']
  },
  
  // CSS конфигурация
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          // Кастомизация Ant Design темы
          '@primary-color': '#1890ff',
          '@link-color': '#1890ff',
          '@success-color': '#52c41a',
          '@warning-color': '#faad14',
          '@error-color': '#f5222d',
          '@font-size-base': '14px',
          '@heading-color': 'rgba(0, 0, 0, 0.85)',
          '@text-color': 'rgba(0, 0, 0, 0.65)',
          '@text-color-secondary': 'rgba(0, 0, 0, 0.45)',
          '@disabled-color': 'rgba(0, 0, 0, 0.25)',
          '@border-radius-base': '6px',
          '@box-shadow-base': '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
        },
        javascriptEnabled: true
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // Переменные окружения
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Мультимедиа ресурсы
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr', '**/*.bin']
})
