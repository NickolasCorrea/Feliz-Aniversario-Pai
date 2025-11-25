import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // IMPORTANTE: Mude '/nome-do-seu-repositorio/' para o nome exato do seu repo no GitHub
    // Exemplo: se o repo é 'niver-pai', mude para '/niver-pai/'
    base: '/nome-do-seu-repositorio/',
    define: {
      // Isso permite que o código continue usando process.env.API_KEY mesmo no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});