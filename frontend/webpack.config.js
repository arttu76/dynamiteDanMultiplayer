import HtmlWebpackPlugin from 'html-webpack-plugin';

import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	entry: './src/index.ts',
	devServer: {
		proxy: {
			'/socket.io/': 'http://localhost:55080/socket.io/',
		  },
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		compress: true,
		hot: true,
		open: true,
		port: 9000
	},
	devtool: 'inline-source-map',
	mode: 'production',
	output: {
		filename: '[contenthash].js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: "",
		clean: true
	},
	plugins: [new HtmlWebpackPlugin({
		filename: 'index.html',
		inject: true,
		template: 'resources/index.html',
		favicon: "resources/favicon.ico"
	})],
	module: {
		rules: [{
			test: /\.ts$/,
			use: 'ts-loader',
			exclude: /node_modules/,
		}, {
			test: /\.css$/i,
			use: ['style-loader', 'css-loader'],
		}, {
			test: /\.(png|jpg|mp3)$/i,
			type: 'asset/resource',
		}],
	},
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000
	},
	resolve: {
		extensions: ['.ts', '.sna', '.js']
	}
};
