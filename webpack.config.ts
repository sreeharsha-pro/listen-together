import * as webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import CopyWebpackPlugin from 'copy-webpack-plugin';


let env: Record<string, string> = {};
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^[\'"]|[\'"]$/g, '');
      if (key && !key.startsWith('#')) {
        env[key] = value;
      }
    }
  });
  //console.log('Environment variables loaded:', Object.keys(env));
} catch (e) {
  console.log('No .env file found or error reading it. Using empty env.');
}


// Convert env object into DefinePlugin-compatible format
const defineEnv = Object.fromEntries(
  Object.entries(env).map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
);

//console.log("DefinePlugin will inject:", defineEnv);


const config: webpack.Configuration = {
  mode: process.env.NODE_ENV as "development" | "production" | "none" || 'development',
  entry: {
    main: './src/index.ts',
    content: './src/content.ts',
    background: './src/background.ts',
    popup: './src/popup/popup.ts'
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
      crypto: false
    },
  },
  plugins: [
    new webpack.DefinePlugin(defineEnv),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/icons/', to: 'icons/' },
        { from: 'src/popup/popup.html', to: '.' },
      ],
    }),
  ],
};

export default config;