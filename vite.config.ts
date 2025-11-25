import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Base configurada para o nome do repositório
    base: '/Feliz-Aniversario-Pai/',
    define: {
      // Isso permite que o código continue usando process.env.API_KEY mesmo no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});