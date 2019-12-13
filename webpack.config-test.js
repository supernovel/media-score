import nodeExternals from 'webpack-node-externals';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const config = {
    mode: 'development',
    target: 'node',
    externals: [nodeExternals({whitelist: /^lodash-es/ })],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'ts-loader',
                    }
                ]
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [new TsconfigPathsPlugin()]
    },
};

export default config;
