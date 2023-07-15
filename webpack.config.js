const EventHooksPlugin =require('event-hooks-webpack-plugin');
const { CallbackTask }  =require( 'event-hooks-webpack-plugin/lib/tasks');
const TerserPlugin  =require( 'terser-webpack-plugin');
const TsconfigPathsPlugin  =require( 'tsconfig-paths-webpack-plugin');

const hashNameExclude = ['ScoreBar'];

/** @type {import('webpack').Configuration} */
const config = {
    output: {
        filename: pathData => {
            if (
                process.env.NODE_ENV === 'production' &&
                !hashNameExclude.includes(pathData.chunk.name)
            ) {
                return '[chunkhash].js';
            } else {
                return '[name].js';
            }
        }
    },
    externals: [
        {
            window: 'window'
        }
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /(node_modules|bower_components)/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.scss$/,
                use: [
                    // applied from right to left
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        plugins: [new TsconfigPathsPlugin()],
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat'
        }
    },
    plugins: [
        new EventHooksPlugin({
            emit: new CallbackTask((compilation, callback) => {
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
                if (
                    process.env.VENDOR == 'firefox' &&
                    compilation.assets['ScoreBar.js']
                ) {
                    const source = `
                        const script = document.createElement('script');
                        script.innerHTML = ${stringify(
                            compilation.assets['ScoreBar.js'].source()
                        )};
                        document.body.appendChild(script);
                    `;

                    compilation.assets['ScoreBar.js'].source = () => {
                        return source;
                    };
                }

                callback();
            })
        })
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: true,
                parallel: true,
                terserOptions: {
                    compress: {
                        drop_console: true
                    }
                }
            })
        ],
    }
};

module.exports = config;

function stringify(obj) {
    if (obj instanceof Date) {
        return 'new Date(' + stringify(obj.toISOString()) + ')';
    }
    if (obj === undefined) {
        return 'undefined';
    }
    return JSON.stringify(obj)
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
        .replace(/</g, '\\u003C')
        .replace(/>/g, '\\u003E')
        .replace(/\//g, '\\u002F');
}
