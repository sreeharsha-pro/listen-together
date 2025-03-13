import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import CopyWebpackPlugin from 'copy-webpack-plugin';


let env: Record<string, string> = {};
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (key && !key.startsWith('#')) {
        env[key] = value;
      }
    }
  });
} catch (e) {
  console.log('No .env file found or error reading it. Using empty env.');
}

// Prepare environment variables for DefinePlugin
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {} as { [key: string]: string });

const config: webpack.Configuration = {
  mode: process.env.NODE_ENV as "development" | "production" | "none" || 'development',
  entry: {
    main: './src/index.ts',
    content: './src/content.ts',
    background: './src/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    },
  devtool: false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      // Disable Node.js core modules
      path: false,
      fs: false,
      os: false,
      crypto: false,
    }
    },
    plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || 'development',
        ...env
      })
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/icons/', to: 'icons/' },
        { from: 'src/popup.html', to: '.' },
      ],
    }),
  ],
};

export default config;